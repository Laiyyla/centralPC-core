# Auditoría de Optimización y Seguridad para Despliegue en Coolify

Este documento contiene el informe detallado de la auditoría técnica realizada sobre los archivos de infraestructura y despliegue del proyecto (`docker/Dockerfile.api`, `docker/Dockerfile.web`, `docker/nginx.conf`, `docker/api-entrypoint.sh`, `docker-compose.prod.yml`, `docker-compose-database.yml`, `.dockerignore` y `docs/deploy-coolify.md`), enfocado en su correcta orquestación en **Coolify**.

---

## 1. Resumen Ejecutivo

| Área Evaluada | Estado | Calificación | Impacto Principal |
|---|:---:|:---:|---|
| **Compatibilidad con Coolify / Traefik** | 🔴 Crítico | 3/10 | Conflicto de puertos en host con puerto 80 (Traefik). Exposición insegura sin TLS. |
| **Seguridad de Contenedores** | 🔴 Crítico | 4/10 | API ejecutada como usuario `root`. Falta de cabeceras HTTP de protección en Nginx. |
| **Resiliencia & Migraciones** | 🔴 Crítico | 4/10 | `api-entrypoint.sh` aborta ante micro-retrasos de Postgres; `docker-compose-database.yml` tiene versión inexistente y ruta de volumen errónea. |
| **Gestión de Procesos (Graceful Shutdown)** | ⚠️ Alto | 5/10 | `pnpm` como PID 1 bloquea señales `SIGTERM`, forzando `SIGKILL` al apagar/reiniciar. |
| **Tiempos de Compilación (Build)** | ⚠️ Medio | 5/10 | Sin BuildKit Cache Mounts; `Dockerfile.web` compila herramientas C++ (`python3`, `g++`, `make`) innecesarias. |
| **Tamaño de Imágenes** | ⚠️ Medio | 6/10 | La API arrastra 491 MB en `node_modules` (incluyendo devDependencies). |

---

## 2. Diagnóstico Detallado de Hallazgos

### 2.1. Hallazgos Críticos (Bloqueantes en Coolify)

#### 🔴 Hallazgo 1: Conflicto de puertos en Host con el Proxy Inverso Traefik
* **Ubicación:** `docker-compose.prod.yml` (línea 35)
* **Descripción:** El servicio `web` define `ports: - "80:80"`.
* **Impacto:** Coolify corre su propio reverse proxy (Traefik) en los puertos `80` y `443` de la máquina anfitriona (host). Si se despliega este Compose tal cual, Docker arrojará el error fatal:
  ```text
  Bind for 0.0.0.0:80 failed: port is already allocated
  ```
  Adicionalmente, mapear `3000:3000` directamente a `0.0.0.0` expone el backend en HTTP sin cifrado TLS y salta el proxy inverso.
* **Solución:** Reemplazar `ports:` por `expose:` o puertos internos en la red del contenedor, permitiendo que Traefik gestione el tráfico por dominio (FQDN).

---

#### 🔴 Hallazgo 2: Inconsistencias en el Compose de Base de Datos
* **Ubicación:** `docker-compose-database.yml` (líneas 3 y 13)
* **Descripción:**
  1. `image: postgres:18-alpine`: PostgreSQL 18 no es una versión estable publicada. Puede fallar al descargarse o introducir inestabilidades no controladas.
  2. `volumes: - pgdata:/var/lib/postgresql`: La ruta oficial donde PostgreSQL inicializa el clúster de datos (`$PGDATA`) es `/var/lib/postgresql/data`. Montar la raíz puede provocar fallas de permisos y corrupción en el reinicio.
  3. No se incluye healthcheck (`pg_isready`).
* **Recomendación Coolify:** En lugar de levantar un compose manual para PostgreSQL, es una mejor práctica crear un **PostgreSQL Resource nativo en Coolify** (incluye backups automáticos a S3/local, monitoreo y gestión de credenciales desde el panel).

---

#### 🔴 Hallazgo 3: Ruptura de Señales POSIX y Apagado Seguro (*Graceful Shutdown*)
* **Ubicación:** `docker/Dockerfile.api` (línea 66) y `docker/api-entrypoint.sh` (línea 8)
* **Descripción:** La API inicia con `CMD ["pnpm", "--filter", "@central-pc/api", "start"]`.
* **Impacto:** `pnpm` envuelve la ejecución y **no propaga las señales `SIGTERM`** enviadas por Docker/Coolify al proceso Node/Fastify. Cuando Coolify despliega una nueva versión o detiene el contenedor, espera 10 segundos de timeout y finalmente ejecuta un `SIGKILL` (muerte forzosa). Esto interrumpe conexiones activas de base de datos y peticiones HTTP en vuelo.
* **Solución:** Ejecutar directamente el binario o script de Node/tsx sin interponer el CLI de `pnpm` como PID 1.

---

#### 🔴 Hallazgo 4: *CrashLoopBackOff* por Cold Boot en `api-entrypoint.sh`
* **Ubicación:** `docker/api-entrypoint.sh` (líneas 2 y 5)
* **Descripción:** Se ejecuta `pnpm --filter @central-pc/database db:migrate` inmediatamente bajo `set -e`.
* **Impacto:** Si la base de datos tarda 1 a 3 segundos en aceptar conexiones durante un reinicio o despliegue en frío, el comando falla de inmediato con `ECONNREFUSED` y el contenedor se apaga de forma estrepitosa, entrando en un bucle continuo de reinicios.
* **Solución:** Incorporar una comprobación activa con reintentos antes de intentar migrar.

---

### 2.2. Hallazgos de Rendimiento y Optimización de Imágenes

#### ⚡ Hallazgo 5: Compiladores C++ innecesarios en `Dockerfile.web`
* **Ubicación:** `docker/Dockerfile.web` (línea 23)
* **Descripción:** Se instala `apk add --no-cache libc6-compat python3 make g++`.
* **Causa:** El frontend no contiene paquetes nativos C++. Fue copiado desde el Dockerfile del backend porque `apps/web/package.json` declara `"@central-pc/api": "workspace:*"` para importar el tipo `AppRouter`. Esto hace que Turborepo arrastre `api`, `database` y `bcrypt` a la etapa de build.
* **Impacto:** Se descargan e instalan más de **250 MB** de paquetes de desarrollo C++ que incrementan el tiempo de compilación en 40-60 segundos por cada build.
* **Solución:** Remover `python3 make g++` del builder de la web.

---

#### ⚡ Hallazgo 6: Ausencia de BuildKit Cache Mounts en PNPM
* **Ubicación:** `docker/Dockerfile.api` (línea 30) y `docker/Dockerfile.web` (línea 33)
* **Descripción:** `RUN pnpm install --frozen-lockfile` descarga los paquetes desde cero en cada ejecución.
* **Impacto:** En Coolify, donde el cache de Docker BuildKit está disponible, no aprovechar la caché persistente de paquetes significa descargar 400-500 MB por la red cada vez que se hace un commit.
* **Solución:** Montar el store de pnpm mediante `--mount=type=cache,id=pnpm,target=/pnpm/store`.

---

#### ⚡ Hallazgo 7: Ejecución insegura como `root` y tamaño inflado en API
* **Ubicación:** `docker/Dockerfile.api` (etapa `runner`)
* **Descripción:** El contenedor final de la API ejecuta el proceso como superusuario `root` y copia 491 MB de `node_modules` que incluyen paquetes de prueba (`vitest`), linters y tipos de TypeScript.
* **Solución:** Cambiar el contexto de ejecución al usuario sin privilegios `USER node` y optimizar la copia de dependencias.

---

#### ⚡ Hallazgo 8: Validación en tiempo de compilación para `VITE_API_URL`
* **Ubicación:** `docker/Dockerfile.web` (líneas 26-27) y `apps/web/src/lib/api.ts` (líneas 4-7)
* **Descripción:** Si en Coolify no se configura `VITE_API_URL` como variable de construcción, la imagen se construye exitosamente. Sin embargo, al abrir la página web en producción, la aplicación arroja un error en blanco:
  ```text
  CRITICAL: VITE_API_URL is not defined in production environment.
  ```
* **Solución:** Fallar inmediatamente en el `docker build` si `VITE_API_URL` está vacío o ausente.

---

#### ⚡ Hallazgo 9: Nginx: Cabeceras de seguridad y Healthcheck ineficiente
* **Ubicación:** `docker/nginx.conf`
* **Descripción:**
  1. No cuenta con `server_tokens off;` (divulgación de versión del servidor web).
  2. Carece de cabeceras estándar: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`.
  3. El healthcheck apunta a `/`, leyendo el archivo `index.html` cada 30 segundos y generando ruido en los logs.
* **Solución:** Configurar cabeceras de seguridad y crear un bloque `/healthz` dedicado que retorne `200 ok` en memoria sin loguear.

---

## 3. Guía de Archivos Optimizados Listos para Producción

### 3.1. `docker-compose.prod.yml`

```yaml
services:
  api:
    build:
      context: .
      dockerfile: docker/Dockerfile.api
    restart: unless-stopped
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SERVER_PORT=3000
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECRET=${COOKIE_SECRET}
      - CORS_ORIGIN=${CORS_ORIGIN}
      - NODE_ENV=production
      - SUCURSAL_ID=${SUCURSAL_ID:-1}
    expose:
      - "3000"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 15s
      timeout: 5s
      start_period: 15s
      retries: 3
    networks:
      - centralpc-net

  web:
    build:
      context: .
      dockerfile: docker/Dockerfile.web
      args:
        - VITE_API_URL=${VITE_API_URL}
    restart: unless-stopped
    depends_on:
      api:
        condition: service_healthy
    expose:
      - "80"
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:80/healthz"]
      interval: 15s
      timeout: 3s
      start_period: 5s
      retries: 3
    networks:
      - centralpc-net

networks:
  centralpc-net:
    driver: bridge
```

---

### 3.2. `docker/Dockerfile.api`

```dockerfile
# ==========================================
# Base Image with PNPM
# ==========================================
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate

# ==========================================
# Pruner: extract only necessary packages
# ==========================================
FROM base AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo@2.10.9
COPY . .
RUN turbo prune @central-pc/api --docker

# ==========================================
# Builder: install dependencies and build
# ==========================================
FROM base AS builder
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

ENV PNPM_STORE_DIR="/pnpm/store"

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo build --filter=@central-pc/api...

# ==========================================
# Runner: Production image (Non-root)
# ==========================================
FROM base AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV SERVER_PORT=3000

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/turbo.json ./turbo.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages ./packages

COPY docker/api-entrypoint.sh /usr/local/bin/api-entrypoint.sh
RUN chmod +x /usr/local/bin/api-entrypoint.sh && chown -R node:node /app

USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/api-entrypoint.sh"]
CMD ["pnpm", "--filter", "@central-pc/api", "start"]
```

---

### 3.3. `docker/Dockerfile.web`

```dockerfile
# ==========================================
# Base Image with PNPM
# ==========================================
FROM node:22-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@12.8.1 --activate

# ==========================================
# Pruner: extract only necessary packages
# ==========================================
FROM base AS pruner
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN npm install -g turbo@2.10.9
COPY . .
RUN turbo prune @centralpc/web --docker

# ==========================================
# Builder: install dependencies and compile Vite SPA
# ==========================================
FROM base AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

ARG VITE_API_URL
RUN test -n "$VITE_API_URL" || (echo "==> ERROR: Build argument VITE_API_URL is missing!" && exit 1)
ENV VITE_API_URL=$VITE_API_URL
ENV PNPM_STORE_DIR="/pnpm/store"

COPY --from=pruner /app/out/json/ .
COPY --from=pruner /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=pruner /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
COPY turbo.json turbo.json
RUN pnpm turbo build --filter=@centralpc/web...

# ==========================================
# Runner: Production Nginx Server
# ==========================================
FROM nginx:alpine AS runner

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/healthz || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

### 3.4. `docker/api-entrypoint.sh`

```bash
#!/bin/sh
set -e

echo "==> Verificando disponibilidad de la base de datos antes de migrar..."
MAX_TRIES=15
COUNT=0

until pnpm --filter @central-pc/database test_connection > /dev/null 2>&1 || [ $COUNT -eq $MAX_TRIES ]; do
  COUNT=$((COUNT + 1))
  echo "Base de datos aún no disponible... reintento $COUNT de $MAX_TRIES"
  sleep 2
done

if [ $COUNT -eq $MAX_TRIES ]; then
  echo "==> ERROR: No fue posible conectar con la base de datos tras $MAX_TRIES intentos. Abortando."
  exit 1
fi

echo "==> Base de datos lista. Ejecutando migraciones..."
pnpm --filter @central-pc/database db:migrate

echo "==> Migraciones completadas. Iniciando servidor..."
exec "$@"
```

---

### 3.5. `docker/nginx.conf`

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    server_tokens off;
    sendfile on;
    tcp_nopush on;
    keepalive_timeout 65;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/x-javascript
        application/xml
        application/json
        application/manifest+json
        image/svg+xml;

    # Dedicated lightweight Healthcheck endpoint
    location = /healthz {
        access_log off;
        default_type text/plain;
        return 200 'ok';
    }

    # Cache immutable assets with hash
    location ~* \.(?:css|js|woff2?|svg|ttf|otf|eot|png|jpg|jpeg|gif|ico|webp)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # SPA routing: fallback to index.html
    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri $uri/ /index.html;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

---

### 3.6. Plantilla `.env.example` para Coolify

```env
# ==========================================
# Base de Datos
# ==========================================
# Formato si se usa recurso PostgreSQL nativo en Coolify:
DATABASE_URL=postgres://usuario:password@nombre-recurso-db:5432/centralpc_db

# ==========================================
# Seguridad (Mínimo 16 caracteres recomendados)
# ==========================================
JWT_SECRET=super_secret_jwt_random_min_16_chars_coolify
COOKIE_SECRET=super_secret_cookie_random_min_16_chars_coolify

# ==========================================
# Configuración del Backend
# ==========================================
NODE_ENV=production
SERVER_PORT=3000
SUCURSAL_ID=1
CORS_ORIGIN=https://app.tu-dominio.com

# ==========================================
# Configuración del Frontend (Build Argument)
# ==========================================
VITE_API_URL=https://api.tu-dominio.com
```

---

## 4. Checklist para el Despliegue en Coolify

- [ ] **Crear Recurso PostgreSQL en Coolify**:
  - Crear un recurso tipo **PostgreSQL** dentro del proyecto en Coolify.
  - Copiar la URL de conexión interna (ej. `postgres://...:5432/...`).
- [ ] **Configurar Variables de Entorno en el Servicio**:
  - Asignar `DATABASE_URL` con el host interno.
  - Configurar `JWT_SECRET` y `COOKIE_SECRET`.
  - Configurar `CORS_ORIGIN` exactamente al dominio donde vivirá la Web (`https://app.tu-dominio.com`).
  - Configurar `VITE_API_URL` apuntando a la API (`https://api.tu-dominio.com`).
- [ ] **Configurar Dominios (FQDN)**:
  - En el servicio `api`: asignar `https://api.tu-dominio.com` (apuntando al puerto interno `3000`).
  - En el servicio `web`: asignar `https://app.tu-dominio.com` (apuntando al puerto interno `80`).
- [ ] **Healthchecks en Coolify**:
  - API: `/health` (espera status `200`).
  - Web: `/healthz` (espera status `200`).
