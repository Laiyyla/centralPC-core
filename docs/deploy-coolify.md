# Guía de Despliegue en Coolify — Central PC Core

Guía completa para desplegar **centralPC-core** en producción sobre **Coolify** con Traefik como reverse proxy y TLS automático mediante Let's Encrypt.

---

## 1. Arquitectura de Despliegue

```
                    ┌─────────────────────────────────┐
                    │       Coolify / Traefik          │
                    │   Reverse Proxy + Let's Encrypt  │
                    └───────┬─────────────────┬────────┘
                            │                 │
        https://app.dominio.com         https://api.dominio.com
                            │                 │
                            ▼                 ▼
                 ┌──────────────────┐  ┌──────────────────┐
                 │    apps/web      │  │    apps/api      │
                 │  (Nginx Alpine)  │  │ (Node 22 Alpine) │
                 │   expose: 80    │  │  expose: 3000    │
                 │  HC: /healthz   │  │  HC: /health     │
                 └──────────────────┘  └────────┬─────────┘
                                                │
                                                ▼ (DATABASE_URL)
                                       ┌──────────────────┐
                                       │    PostgreSQL 18  │
                                       │  (Recurso Coolify │
                                       │   o externo)      │
                                       └──────────────────┘
```

| Servicio | Imagen base | Puerto interno | Healthcheck | Descripción |
|----------|-------------|:--------------:|-------------|-------------|
| **API** | `node:22-alpine` | 3000 | `/health` | Fastify + tRPC. Ejecuta migraciones Drizzle al arrancar. Corre como usuario `node` (no root). |
| **Web** | `nginx:alpine` | 80 | `/healthz` | SPA compilada con Vite, servida por Nginx con gzip, caché inmutable y headers de seguridad. |
| **BD** | `postgres:18-alpine` | 5432 | `pg_isready` | Se recomienda recurso nativo de Coolify. Si se usa compose externo, ver sección 6. |

---

## 2. Archivos de Infraestructura

| Archivo | Propósito |
|---------|-----------|
| `docker-compose.prod.yml` | Manifiesto de servicios con `expose` (no `ports`), healthchecks y red interna. Compatible con Traefik. |
| `docker/Dockerfile.api` | Multi-stage build: pruner → builder (con BuildKit cache) → runner (usuario `node`, no root). |
| `docker/Dockerfile.web` | Multi-stage build: pruner → builder (valida `VITE_API_URL` en build-time) → Nginx Alpine. |
| `docker/api-entrypoint.sh` | Espera conexión a BD con reintentos (TCP via Node.js), ejecuta migraciones, luego `exec` del servidor. |
| `docker/nginx.conf` | Nginx con `server_tokens off`, headers de seguridad, gzip, caché inmutable, endpoint `/healthz` y SPA routing. |
| `.dockerignore` | Excluye `node_modules`, `.turbo`, `dist`, `.env`, `.git` del contexto de build. |

---

## 3. Decisiones Técnicas

### 3.1. `expose` en lugar de `ports`

Los servicios usan `expose` y no `ports` en `docker-compose.prod.yml`. Esto evita conflictos con Traefik (que ocupa los puertos 80/443 del host) y garantiza que el tráfico pase siempre por el reverse proxy con TLS.

### 3.2. Señales POSIX y Graceful Shutdown

El CMD de la API ejecuta Node directamente:

```dockerfile
CMD ["node", "--import", "tsx", "apps/api/src/server.ts"]
```

Esto evita interponer `pnpm` como PID 1, que no propaga `SIGTERM`. Con `exec "$@"` en el entrypoint, Node recibe las señales de Docker/Coolify directamente, permitiendo un apagado limpio de conexiones de BD y peticiones HTTP en vuelo.

### 3.3. Reintentos de conexión a BD

El entrypoint espera a que PostgreSQL acepte conexiones TCP antes de ejecutar migraciones, usando un check ligero con `node` y el módulo `net` nativo (sin dependencias extra). Esto evita `CrashLoopBackOff` en cold boot cuando la BD tarda 1-3 segundos en estar lista.

### 3.4. Uso de `tsx` en producción

La API se ejecuta con `tsx` (transpilación TypeScript on-the-fly) porque los paquetes del workspace (`@central-pc/database`, `@central-pc/schemas`) exportan archivos `.ts` directamente. Migrar a `node dist/server.js` requeriría refactorizar los exports de todos los paquetes del monorepo. Para el volumen actual (aplicación interna, 1-2 tiendas), el overhead de transpilación en el arranque es despreciable.

### 3.5. Headers de seguridad en Nginx

En Nginx, `add_header` dentro de un bloque `location` anula los headers definidos a nivel `server`. Por eso los headers de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`) se repiten en cada `location` que usa `add_header`.

### 3.6. BuildKit Cache Mounts

Ambos Dockerfiles usan `--mount=type=cache,id=pnpm,target=/pnpm/store` para persistir el store de pnpm entre builds. En Coolify (BuildKit activo por defecto) esto evita descargar ~400-500 MB de paquetes en cada commit.

---

## 4. Despliegue en Coolify

### 4.1. Prerequisitos

1. **Instancia de Coolify** funcionando con acceso al panel.
2. **Dominio** con registros DNS apuntando al servidor:
   - `api.tu-dominio.com` → IP del servidor
   - `app.tu-dominio.com` → IP del servidor
3. **Repositorio Git** accesible desde Coolify (GitHub, GitLab, etc.).

### 4.2. Crear la Base de Datos

> **Recomendado:** Usar un recurso PostgreSQL nativo de Coolify (incluye backups automáticos, monitoreo y gestión de credenciales).

1. En tu proyecto de Coolify: **+ New Resource** → **Database** → **PostgreSQL**.
2. Versión: `18` (o la última estable disponible).
3. Configurar nombre de BD: `centralpc_db`.
4. Anotar la **URL de conexión interna** que Coolify genera (formato: `postgres://user:pass@recurso-interno:5432/centralpc_db`).

### 4.3. Opción A: Docker Compose (Recomendado)

1. **+ New Resource** → **Docker Compose** → **From Git Repository**.
2. Seleccionar repositorio y rama de producción (`main`).
3. **Docker Compose Location:** `docker-compose.prod.yml`
4. Configurar **Environment Variables** (ver sección 5).
5. Configurar **dominios (FQDN)** para cada servicio:

| Servicio | Dominio | Puerto interno |
|----------|---------|:--------------:|
| `api` | `https://api.tu-dominio.com` | 3000 |
| `web` | `https://app.tu-dominio.com` | 80 |

6. Hacer clic en **Deploy**.

### 4.4. Opción B: Recursos Dockerfile Separados

Si prefieres administrar cada contenedor individualmente:

#### Recurso API

| Campo | Valor |
|-------|-------|
| Build Pack | Dockerfile |
| Base Directory | `/` |
| Dockerfile Path | `docker/Dockerfile.api` |
| Port Exposes | `3000` |
| Domain | `https://api.tu-dominio.com` |
| Health Check Path | `/health` |

#### Recurso Web

| Campo | Valor |
|-------|-------|
| Build Pack | Dockerfile |
| Base Directory | `/` |
| Dockerfile Path | `docker/Dockerfile.web` |
| Port Exposes | `80` |
| Domain | `https://app.tu-dominio.com` |
| Health Check Path | `/healthz` |

> **Importante:** En el recurso Web, `VITE_API_URL` debe marcarse como **Build Variable** (no runtime), ya que Vite la embebe en el bundle durante la compilación.

---

## 5. Variables de Entorno

### Variables de la API (Runtime)

| Variable | Requerida | Descripción | Ejemplo |
|----------|:---------:|-------------|---------|
| `DATABASE_URL` | Si | URL de conexión a PostgreSQL (usar host interno de Coolify) | `postgres://user:pass@pg-recurso:5432/centralpc_db` |
| `JWT_SECRET` | Si | Clave para firmar tokens JWT. Mínimo 16 caracteres, idealmente 32+ | `Generar con: openssl rand -hex 32` |
| `COOKIE_SECRET` | Si | Clave para firmar cookies de sesión. Mínimo 16 caracteres | `Generar con: openssl rand -hex 32` |
| `CORS_ORIGIN` | Si | URL exacta del frontend (con protocolo, sin trailing slash) | `https://app.tu-dominio.com` |
| `SERVER_PORT` | No | Puerto del servidor Fastify (default: 3000) | `3000` |
| `NODE_ENV` | No | Entorno de ejecución (default: production) | `production` |
| `SUCURSAL_ID` | No | ID de sucursal (default: 1) | `1` |

### Variables del Web (Build-time)

| Variable | Requerida | Tipo | Descripción | Ejemplo |
|----------|:---------:|------|-------------|---------|
| `VITE_API_URL` | Si | **Build Arg** | URL pública de la API. Si no se configura, el build falla inmediatamente. | `https://api.tu-dominio.com` |

### Plantilla `.env`

```env
# Base de Datos (usar URL interna de Coolify)
DATABASE_URL=postgres://usuario:password@recurso-pg:5432/centralpc_db

# Seguridad (generar con: openssl rand -hex 32)
JWT_SECRET=
COOKIE_SECRET=

# Backend
NODE_ENV=production
SERVER_PORT=3000
SUCURSAL_ID=1
CORS_ORIGIN=https://app.tu-dominio.com

# Frontend (Build Argument)
VITE_API_URL=https://api.tu-dominio.com
```

---

## 6. Base de Datos con Docker Compose (alternativa)

Si no se usa el recurso nativo de Coolify, el archivo `docker-compose-database.yml` levanta PostgreSQL:

```bash
docker compose -f docker-compose-database.yml up -d
```

Puntos clave de la configuración:
- **Imagen:** `postgres:18-alpine` (versión estable actual).
- **Volumen:** Montado en `/var/lib/postgresql/data` (ruta oficial de `$PGDATA`).
- **Healthcheck:** `pg_isready` verifica que PostgreSQL acepta conexiones cada 10s.

> **Nota:** Este compose expone el puerto `5432` en el host. En Coolify, donde Traefik gestiona la red, es preferible usar el recurso nativo que mantiene PostgreSQL en la red interna sin exposición directa.

---

## 7. Migraciones y Datos Iniciales

### Migraciones Automáticas

El entrypoint de la API (`docker/api-entrypoint.sh`) ejecuta automáticamente en cada inicio:

1. **Espera de BD:** Verifica conexión TCP a PostgreSQL con hasta 15 reintentos (2s entre cada uno).
2. **Migración:** Ejecuta `pnpm --filter @central-pc/database db:migrate` (Drizzle Kit).
3. **Arranque:** Si ambos pasos son exitosos, inicia el servidor con `exec`.

Si la migración falla, el contenedor se detiene (`set -e`), evitando que la API arranque con un schema inconsistente.

### Seeds (Datos Iniciales)

Los seeds **nunca** se ejecutan automáticamente en producción. Para ejecutarlos manualmente:

**Desde el terminal de Coolify:**
```bash
pnpm --filter @central-pc/database db:seed
```

**Desde SSH al servidor:**
```bash
docker exec -it <contenedor_api> pnpm --filter @central-pc/database db:seed
```

---

## 8. Pruebas Locales

### Construir y levantar

```bash
# Levantar BD local (si no tienes una)
docker compose -f docker-compose-database.yml up -d

# Esperar a que esté lista
docker compose -f docker-compose-database.yml ps  # STATUS: healthy

# Levantar API + Web
VITE_API_URL=http://localhost:3000 \
DATABASE_URL=postgres://usuario:password@localhost:5432/centralpc_db \
JWT_SECRET=dev-secret-min-16-chars \
COOKIE_SECRET=dev-cookie-min-16-chars \
CORS_ORIGIN=http://localhost \
docker compose -f docker-compose.prod.yml up --build
```

### Verificar healthchecks

```bash
# API
curl http://localhost:3000/health
# → {"status":"ok"}

# Web (a través de red Docker, no localhost:80 ya que usa expose)
docker compose -f docker-compose.prod.yml exec web wget -qO- http://localhost:80/healthz
# → ok

# Estado general
docker compose -f docker-compose.prod.yml ps
# Ambos servicios deben mostrar (healthy)
```

> **Nota:** Con `expose` en lugar de `ports`, los servicios no son accesibles directamente desde `localhost`. Para pruebas locales completas, puedes temporalmente cambiar `expose` por `ports` o usar `docker compose exec` para verificar dentro de la red.

### Construir imágenes individuales

```bash
# API
docker build -f docker/Dockerfile.api -t centralpc-api:test .

# Web (requiere VITE_API_URL)
docker build -f docker/Dockerfile.web \
  --build-arg VITE_API_URL=http://localhost:3000 \
  -t centralpc-web:test .
```

---

## 9. Troubleshooting

### El contenedor de la API entra en crash loop

**Causa probable:** La BD no está accesible.

1. Verificar que PostgreSQL está corriendo y healthy.
2. Verificar que `DATABASE_URL` usa el host correcto (nombre del recurso interno en Coolify, no `localhost`).
3. Revisar logs: `docker logs <contenedor_api>` — buscar "Database not ready" o "Could not connect".

### La web compila pero muestra pantalla en blanco

**Causa probable:** `VITE_API_URL` no fue configurada como Build Argument.

1. Verificar que `VITE_API_URL` está configurada como **variable de build** (no runtime) en Coolify.
2. Reconstruir la imagen — Vite embebe la variable durante la compilación.
3. En el navegador, abrir DevTools → Console. Si dice `CRITICAL: VITE_API_URL is not defined`, confirma el problema.

### Error "port is already allocated" al desplegar

**Causa:** El compose usa `ports` en vez de `expose`, conflictando con Traefik.

Verificar que `docker-compose.prod.yml` tiene `expose:` y no `ports:` para ambos servicios.

### La API no se apaga limpiamente (SIGKILL tras 10s)

**Causa:** El CMD usa `pnpm` como intermediario.

Verificar que el `CMD` en `Dockerfile.api` ejecuta Node directamente:
```dockerfile
CMD ["node", "--import", "tsx", "apps/api/src/server.ts"]
```

### Los headers de seguridad no aparecen en respuestas

**Causa:** Nginx anula headers del bloque `server` cuando un `location` define sus propios `add_header`.

Verificar que cada bloque `location` en `nginx.conf` que usa `add_header` también incluye los headers de seguridad (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).

---

## 10. Checklist de Validación

- [ ] PostgreSQL creado en Coolify (o compose de BD verificado con healthcheck healthy).
- [ ] `DATABASE_URL` usa el host interno del recurso de BD en Coolify.
- [ ] `JWT_SECRET` y `COOKIE_SECRET` generados con `openssl rand -hex 32`.
- [ ] `CORS_ORIGIN` coincide exactamente con la URL del frontend (con `https://`, sin trailing slash).
- [ ] `VITE_API_URL` configurada como **Build Argument** apuntando a la URL pública de la API.
- [ ] Dominios FQDN asignados en Coolify: `api` → puerto 3000, `web` → puerto 80.
- [ ] Certificados TLS emitidos por Coolify/Let's Encrypt para ambos dominios.
- [ ] `GET https://api.tu-dominio.com/health` retorna `{"status":"ok"}`.
- [ ] `GET https://app.tu-dominio.com/healthz` retorna `ok`.
- [ ] `docker compose ps` muestra ambos servicios como `(healthy)`.
- [ ] La web carga correctamente y se comunica con la API sin errores CORS.
