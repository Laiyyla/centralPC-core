# Guía de Despliegue en Coolify con Docker — Central PC Core

Esta guía detalla el despliegue en producción para **Coolify** de los servicios **API** (`apps/api`) y **Web** (`apps/web`), conectándose a una base de datos PostgreSQL alojada en el mismo Coolify o externa.

---

## 1. Arquitectura de Despliegue

El proyecto se despliega bajo una arquitectura desacoplada:

- **API (`apps/api`)**: Contenedor Node.js 22 (Alpine) optimizado con `turbo prune`, compilación nativa de `bcrypt` y arranque mediante `tsx`.
  - Puerto interno: `3000`.
  - Incluye **migraciones automáticas** antes de iniciar el servidor.
  - Endpoint `/health` para healthchecks de orquestación.
- **Web (`apps/web`)**: Contenedor Nginx Alpine ultraligero que sirve los assets estáticos generados por Vite en el build.
  - Puerto interno: `80`.
  - Soporta SPA routing (`try_files $uri $uri/ /index.html`), compresión Gzip y headers de caché inmutables para assets.

```
                    ┌───────────────────────────────┐
                    │      Coolify / Traefik         │
                    │   Reverse Proxy + Let's Encrypt│
                    └───────┬───────────────┬────────┘
                            │               │
        https://app.tu-dominio.com     https://api.tu-dominio.com
                            │               │
                            ▼               ▼
                 ┌──────────────────┐  ┌──────────────────┐
                 │    apps/web      │  │    apps/api      │
                 │  (Nginx Alpine)  │  │ (Node 22 Alpine) │
                 │    Puerto 80     │  │   Puerto 3000    │
                 │  HEALTHCHECK: /  │  │ HEALTHCHECK:     │
                 │                  │  │  /health         │
                 └──────────────────┘  └────────┬─────────┘
                                                │
                                                ▼ (DATABASE_URL)
                                       ┌──────────────────┐
                                       │    PostgreSQL     │
                                       │   (Resource BD)   │
                                       └──────────────────┘
```

---

## 2. Archivos del Sistema Docker

| Archivo | Ubicación | Propósito |
|---------|-----------|-----------|
| **Dockerfile API** | `docker/Dockerfile.api` | Multi-stage build con Turborepo. Compila la API y sus paquetes (`database`, `schemas`). El stage `runner` copia selectivamente solo los archivos necesarios para runtime. |
| **Entrypoint API** | `docker/api-entrypoint.sh` | Ejecuta `pnpm --filter @central-pc/database db:migrate` y arranca la API. |
| **Dockerfile Web** | `docker/Dockerfile.web` | Compila la SPA Vite con `VITE_API_URL` y la empaqueta en Nginx Alpine. |
| **Nginx Config** | `docker/nginx.conf` | Configuración Nginx para SPA: compresión Gzip (desde 256 bytes), `sendfile`, `tcp_nopush`, `keepalive_timeout` y caché inmutable para assets con hash. |
| **Docker Compose** | `docker-compose.prod.yml` | Manifiesto de servicios con healthchecks y arranque ordenado (`depends_on: condition: service_healthy`). |
| **Docker Ignore** | `.dockerignore` | Evita enviar `node_modules`, `.turbo`, `dist` al daemon de Docker. |

---

## 3. Healthchecks

Ambos contenedores incluyen `HEALTHCHECK` tanto en sus Dockerfiles como en `docker-compose.prod.yml`. Esto permite a Coolify/Traefik:

- Saber cuándo un contenedor está realmente listo para recibir tráfico.
- Reiniciar automáticamente contenedores en estado `unhealthy`.
- El servicio `web` no arranca hasta que `api` esté `healthy` (`depends_on: condition: service_healthy`).

| Servicio | Endpoint | Intervalo | Timeout | Start Period | Reintentos |
|----------|----------|-----------|---------|--------------|------------|
| **API** | `GET /health` → `{"status":"ok"}` | 30s | 5s | 15s | 3 |
| **Web** | `GET /` → `index.html` (200) | 30s | 5s | 5s | 3 |

---

## 4. Configuración en Coolify

Se recomienda crear un **Nuevo Proyecto** en Coolify con dos recursos:
1. **Recurso 1:** Base de datos PostgreSQL (`PostgreSQL Resource`).
2. **Recurso 2:** Aplicación (mediante **Docker Compose** o **2 Dockerfiles individuales**).

---

### Opción A: Despliegue con Docker Compose (Recomendado)

Esta es la opción más limpia y centralizada en Coolify.

1. En tu proyecto de Coolify, haz clic en **+ New Resource** → **Docker Compose** → **From Git Repository**.
2. Conecta tu repositorio y selecciona la rama de producción (`main` o `production`).
3. En **Docker Compose Location**, indica:
   ```text
   docker-compose.prod.yml
   ```
4. Configura las variables de entorno en la pestaña **Environment Variables**:

```env
# Conexión con el recurso PostgreSQL de Coolify
DATABASE_URL=postgres://usuario:password@postgres-db:5432/centralpc_db

# Seguridad de la API (mínimo 16 caracteres)
JWT_SECRET=super_secret_jwt_key_random_min_16_chars
COOKIE_SECRET=super_secret_cookie_key_random_min_16_chars

# Red y Dominios
SERVER_PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://app.tu-dominio.com
SUCURSAL_ID=1

# URL pública de la API para la compilación de Vite
VITE_API_URL=https://api.tu-dominio.com
```

5. En la configuración de servicios de Coolify, asigna los dominios (FQDN):
   - **Servicio `api`**: `https://api.tu-dominio.com`
   - **Servicio `web`**: `https://app.tu-dominio.com`
6. Haz clic en **Deploy**.

---

### Opción B: Despliegue con Recursos Dockerfile Separados

Si prefieres administrar los contenedores de `api` y `web` de forma individual en Coolify:

#### 1. Recurso Backend (API)
- **New Resource** → **Application** → **From Git Repository**.
- **Build Pack:** `Dockerfile`.
- **Base Directory:** `/`.
- **Dockerfile Path:** `docker/Dockerfile.api`.
- **Port Exposes:** `3000`.
- **Domain:** `https://api.tu-dominio.com`.
- **Health Check Path:** `/health` (configurar en la pestaña de Health Checks de Coolify).
- **Environment Variables:**
  - `DATABASE_URL=postgres://...`
  - `JWT_SECRET=...`
  - `COOKIE_SECRET=...`
  - `SERVER_PORT=3000`
  - `CORS_ORIGIN=https://app.tu-dominio.com`
  - `NODE_ENV=production`
  - `SUCURSAL_ID=1`

#### 2. Recurso Frontend (Web)
- **New Resource** → **Application** → **From Git Repository**.
- **Build Pack:** `Dockerfile`.
- **Base Directory:** `/`.
- **Dockerfile Path:** `docker/Dockerfile.web`.
- **Port Exposes:** `80`.
- **Domain:** `https://app.tu-dominio.com`.
- **Health Check Path:** `/` (configurar en la pestaña de Health Checks de Coolify).
- **Environment Variables (¡Importante: marcar como Build Variable / Build Secret!):**
  - `VITE_API_URL=https://api.tu-dominio.com`

---

## 5. Migraciones y Base de Datos

### Migraciones Automáticas
El archivo `docker/api-entrypoint.sh` se ejecuta automáticamente en cada inicio de contenedor de la API:
```bash
pnpm --filter @central-pc/database db:migrate
```
- Lee las migraciones ubicadas en `packages/database/migrations/`.
- Aplica los cambios pendientes mediante Drizzle Kit.
- Si la migración falla, el contenedor se aborta (`set -e`), previniendo que la API arranque con inconsistencias.

### Ejecución Manual de Seeds
Los seeds **no** se corren solos en producción. Cuando requieras sembrar o inicializar datos:

**Vía Terminal de Coolify:**
1. Ve al recurso de la **API** en Coolify.
2. Abre la pestaña **Terminal** / **Execute Command**.
3. Ejecuta:
   ```bash
   pnpm --filter @central-pc/database db:seed
   ```

**Vía SSH en el servidor:**
```bash
docker exec -it <nombre_del_contenedor_api> pnpm --filter @central-pc/database db:seed
```

---

## 6. Pruebas Locales antes de Producción

Para validar el despliegue localmente con Docker:

```bash
# 1. Construir la imagen de la API
docker build -f docker/Dockerfile.api -t centralpc-api:prod .

# 2. Construir la imagen de la Web (pasando la URL de la API)
docker build -f docker/Dockerfile.web --build-arg VITE_API_URL=http://localhost:3000 -t centralpc-web:prod .

# 3. O levantar todo con el compose de producción
docker compose -f docker-compose.prod.yml up --build
```

Tras levantar, verifica los healthchecks:
```bash
# Comprobar que la API responde
curl http://localhost:3000/health
# Esperado: {"status":"ok"}

# Comprobar que el frontend carga
curl -I http://localhost:80/
# Esperado: HTTP/1.1 200 OK

# Ver estado de los contenedores (columna STATUS debe mostrar "healthy")
docker compose -f docker-compose.prod.yml ps
```

---

## 7. Notas Técnicas

### Sobre el uso de `tsx` en producción
La API se ejecuta con `tsx` (transpilación TypeScript en tiempo de ejecución) en lugar de `node` con JavaScript compilado. Esto se debe a que los paquetes del workspace (`@central-pc/database`, `@central-pc/schemas`) exportan directamente archivos `.ts` como su entry point. Migrar a `node` requeriría refactorizar los exports de todos los paquetes del monorepo.

Para el volumen de carga actual (aplicación interna, 1-2 tiendas), el overhead de `tsx` es despreciable: el coste de transpilación ocurre solo al arranque, y en un servidor Fastify de larga duración, no afecta el rendimiento de las peticiones.

### Optimización del Dockerfile de la API
El stage `runner` copia selectivamente desde el `builder` en lugar de copiar todo `/app`. Esto excluye:
- Caché de Turborepo (`.turbo/`), que puede ser de cientos de MB.
- Artefactos de compilación (`dist/`), innecesarios con `tsx`.

### Configuración de Nginx
- **`gzip_min_length 256`**: Comprime respuestas desde 256 bytes (incluye archivos JS/CSS pequeños que el valor anterior de 10KB ignoraba).
- **`sendfile on` + `tcp_nopush on`**: Optimiza la entrega de archivos estáticos delegando al kernel.
- **`keepalive_timeout 65`**: Mantiene conexiones abiertas para evitar el overhead de re-negociación TCP/TLS en navegaciones rápidas.
- **Tipos Gzip ampliados**: Incluye `application/json`, `application/manifest+json` e `image/svg+xml`.

---

## 8. Checklist de Validación

- [ ] Instancia de PostgreSQL en Coolify creada y con red interna compartida con las apps.
- [ ] `DATABASE_URL` utiliza el nombre del host interno del recurso de base de datos en Coolify.
- [ ] `JWT_SECRET` y `COOKIE_SECRET` son cadenas seguras de al menos 16 a 32 caracteres.
- [ ] `CORS_ORIGIN` en la API apunta exactamente a la URL de la Web con su protocolo (ej. `https://app.tu-dominio.com`).
- [ ] `VITE_API_URL` apunta a la URL pública de la API (ej. `https://api.tu-dominio.com`).
- [ ] Certificados SSL/TLS (HTTPS) emitidos por Coolify para ambos dominios.
- [ ] Healthchecks verificados: `GET /health` en la API retorna `{"status":"ok"}`.
- [ ] `docker compose ps` muestra ambos servicios como `healthy`.
