# centralPC-core

[![pnpm](https://img.shields.io/badge/pnpm-12.8.1-orange?logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Turborepo](https://img.shields.io/badge/Turborepo-2.x-blue?logo=turborepo&logoColor=white)](https://turbo.build/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-5.x-black?logo=fastify&logoColor=white)](https://fastify.dev/)
[![tRPC](https://img.shields.io/badge/tRPC-11.x-blue?logo=trpc&logoColor=white)](https://trpc.io/)
[![React](https://img.shields.io/badge/React-19-cyan?logo=react&logoColor=white)](https://react.dev/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-0.45-green?logo=drizzle&logoColor=white)](https://orm.drizzle.team/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org/)

Repositorio central (**monorepo**) para **centralPC**, una plataforma integral de gestión comercial, técnica y operativa para empresas de ensamblaje de computadoras, venta de componentes y servicio técnico de dispositivos.

El proyecto está administrado con **Turborepo** y **pnpm Workspaces**, diseñado con arquitectura desacoplada y tipado estricto de extremo a extremo (*End-to-End Type Safety*) entre el backend, la base de datos y la interfaz web.

---

## 📑 Tabla de Contenidos

- [🛠️ Stack Tecnológico](#️-stack-tecnológico)
- [📁 Estructura del Monorepo](#-estructura-del-monorepo)
- [🧩 Módulos y Dominio de Negocio](#-módulos-y-dominio-de-negocio)
- [🚀 Requisitos Previos](#-requisitos-previos)
- [⚙️ Guía de Inicio Rápido](#️-guía-de-inicio-rápido)
  - [1. Clonar el repositorio](#1-clonar-el-repositorio)
  - [2. Levantar la base de datos (Docker)](#2-levantar-la-base-de-datos-docker)
  - [3. Configurar variables de entorno](#3-configurar-variables-de-entorno)
  - [4. Instalar dependencias](#4-instalar-dependencias)
  - [5. Migraciones y Seed de datos iniciales](#5-migraciones-y-seed-de-datos-iniciales)
  - [6. Iniciar en desarrollo](#6-iniciar-en-desarrollo)
- [🔑 Credenciales de Prueba](#-credenciales-de-prueba)
- [📜 Scripts Disponibles](#-scripts-disponibles)
- [🌐 Arquitectura de la API (tRPC + REST PDF)](#-arquitectura-de-la-api-trpc--rest-pdf)
- [💻 Aplicación Web](#-aplicación-web)
- [🧪 Pruebas Automatizadas](#-pruebas-automatizadas)
- [🚀 Despliegue en Producción](#-despliegue-en-producción)

---

## 🛠️ Stack Tecnológico

### Monorepo & Herramientas Core
* **Gestor de Monorepo:** [Turborepo 2](https://turbo.build/) + [pnpm Workspaces](https://pnpm.io/workspaces)
* **Gestor de Paquetes:** `pnpm` (v12.8.1)
* **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
* **Testing:** [Vitest](https://vitest.dev/)

### Backend (`apps/api`)
* **Framework Web:** [Fastify 5](https://fastify.dev/)
* **Capa de Comunicación:** [tRPC v11](https://trpc.io/) (con serializador SuperJSON)
* **Seguridad & Sesiones:** `@fastify/jwt`, `@fastify/cookie`, `@fastify/cors`, `@fastify/helmet`, `bcrypt`
* **Generación de Documentos:** `@react-pdf/renderer` para renderizado de comprobantes y órdenes en PDF
* **Validación de Entorno:** [Zod](https://zod.dev/) con *fail-fast* al inicio del servidor

### Frontend Web (`apps/web`)
* **Librería UI:** [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
* **Enrutamiento:** [TanStack Router](https://tanstack.com/router) (file-based routing con tipado seguro)
* **Manejo de Estado y Caché:** [TanStack Query v5](https://tanstack.com/query) + `@trpc/react-query`
* **Estilos & Componentes:** [Tailwind CSS v4](https://tailwindcss.com/), Base UI, [shadcn/ui](https://ui.shadcn.com/), Lucide Icons, Sonner (Toasts)
* **Formularios:** React Hook Form + `@hookform/resolvers/zod`

### Base de Datos & Modelado (`packages/database`)
* **Motor:** [PostgreSQL 18](https://www.postgresql.org/)
* **ORM:** [Drizzle ORM](https://orm.drizzle.team/)
* **Migraciones & Studio:** `drizzle-kit`

---

## 📁 Estructura del Monorepo

```text
centralPC-core/
├── apps/
│   ├── api/                     # Servidor Fastify con routers tRPC y rutas REST (PDF)
│   │   ├── src/
│   │   │   ├── env.ts           # Validación Zod de variables de entorno
│   │   │   ├── server.ts        # Punto de entrada de Fastify y registro de plugins
│   │   │   ├── context.ts       # Contexto tRPC (DB, usuario autenticado, servicios)
│   │   │   ├── procedures/      # Procedimientos tRPC base (públicos y protegidos con RBAC)
│   │   │   ├── routers/         # Definición de rutas tRPC (auth, catalog, clients, orders, payments)
│   │   │   ├── routes/          # Rutas HTTP tradicionales (ej. stream de PDFs)
│   │   │   ├── services/        # Lógica de negocio modularizada con inicialización lazy
│   │   │   └── utils/           # Rate limiting y helpers del servidor
│   │   └── tsconfig.json
│   │
│   └── web/                     # SPA React 19 con Vite y TanStack Router
│       ├── src/
│       │   ├── routes/          # Páginas y subrutas (login, dashboard, orders, catalog, clients)
│       │   ├── components/      # Componentes UI (shadcn, modals de pagos, formularios)
│       │   ├── lib/             # Cliente API, autenticación en browser, helpers
│       │   └── trpc/            # Cliente e instancia tipada de tRPC React Query
│       └── vite.config.ts
│
├── packages/
│   ├── database/                # Acceso a PostgreSQL con Drizzle ORM
│   │   ├── src/
│   │   │   ├── schema/          # Esquemas Drizzle (users, branches, clients, orders, devices, etc.)
│   │   │   ├── db.ts            # Conexión al pool de Postgres
│   │   │   └── seed.ts          # Semilla con datos base para desarrollo
│   │   ├── migrations/          # Migraciones SQL versionadas
│   │   └── drizzle.config.ts
│   │
│   ├── schemas/                 # Validaciones Zod compartidas entre backend y frontend
│   │   ├── auth.schema.ts
│   │   ├── catalog.schema.ts
│   │   ├── clients.schema.ts
│   │   ├── order.schema.ts
│   │   ├── payments.schema.ts
│   │   └── tests/               # Pruebas unitarias de esquemas y lógica financiera
│   │
│   ├── shared/                  # Utilidades y código agnóstico reutilizable
│   └── tsconfig/                # Configuraciones base de TypeScript heredadas en el monorepo
│
├── docs/                        # Documentación complementaria (ej. despliegue en Coolify)
├── docker-compose.yml           # Contenedor de PostgreSQL para desarrollo local
├── turbo.json                   # Definición de pipelines de Turborepo
├── pnpm-workspace.yaml          # Configuración de espacios de trabajo de pnpm
└── vitest.config.ts             # Configuración central de Vitest
```

---

## 🧩 Módulos y Dominio de Negocio

El sistema modela el ciclo de vida completo de la atención comercial y técnica:

1. **Gestión de Sucursales (`branches`):**
   * Configuración de locales físicos con correlativos independientes de comprobantes/órdenes y RUC.

2. **Usuarios y Control de Acceso (`users` & RBAC):**
   * Autenticación basada en JWT y cookies seguras.
   * Roles soportados: `admin`, `tecnico`, `cajero`.

3. **Directorio de Clientes (`clients`):**
   * Registro con validación de documentos (DNI / RUC), teléfono, nombres y búsqueda optimizada.

4. **Catálogo de Productos y Servicios (`catalog`):**
   * Artículos individuales (hardware, componentes, periféricos).
   * Servicios técnicos y mano de obra.
   * **Combos (`combo_components`):** Empaquetado de múltiples componentes bajo un precio y SKU unificado.

5. **Órdenes de Trabajo y Ensambles (`orders`, `devices`, `order_details`):**
   * Registro de equipos por tipo (`pc`, `laptop`, `impresora`, `consola`, `otro`), marcas, números de serie y reporte de fallas.
   * Desglose de piezas utilizadas y servicios asignados.
   * Asignación de técnico responsable.
   * Flujo de estados: `pendiente` ➔ `en_proceso` ➔ `completada` ➔ `entregada` (o `anulada`).
   * Historial de auditoría de cambios de estado (`order_history`).

6. **Control de Pagos y Caja (`payments`):**
   * Registro de adelantos e importes totales.
   * Métodos de pago: `efectivo`, `tarjeta`, `transferencia`, `yape`, `plin`.
   * Validación automática de balances (el pago no puede exceder el saldo restante).

7. **Impresión de Documentos:**
   * Generación al vuelo de boletas y órdenes de servicio en formato PDF mediante `@react-pdf/renderer`.

---

## 🚀 Requisitos Previos

Asegúrate de contar con el siguiente software instalado:

1. **Node.js**: Versión 20 LTS o 22 LTS recomendada.
2. **pnpm**: Versión `12.x` (o superior).
3. **Docker y Docker Compose**: Para levantar PostgreSQL localmente sin configuraciones manuales.

---

## ⚙️ Guía de Inicio Rápido

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/centralPC-core.git
cd centralPC-core
```

### 2. Levantar la base de datos (Docker)

Crea el archivo `.env` en la raíz del proyecto para las credenciales de PostgreSQL:

```env
POSTGRES_USER=adminpostgres
POSTGRES_PASSWORD=Admin123!Server
```

Inicia el contenedor de base de datos en segundo plano:

```bash
docker compose up -d
```

> La base de datos quedará expuesta en `localhost:5432` con el nombre `centralpc_db`.

### 3. Configurar variables de entorno

#### Backend (`apps/api/.env`)
Crea el archivo `apps/api/.env`:

```env
DATABASE_URL=postgres://adminpostgres:Admin123!Server@localhost:5432/centralpc_db
SERVER_PORT=3000
JWT_SECRET=superClaveSecretaDeAlMenos16Caracteres123
COOKIE_SECRET=superClaveSecretaDeCookie16Caracteres123
CORS_ORIGIN=http://localhost:5173
NODE_ENV=development
SUCURSAL_ID=1
```

#### Base de datos (`packages/database/.env`)
Crea el archivo `packages/database/.env`:

```env
DATABASE_URL=postgres://adminpostgres:Admin123!Server@localhost:5432/centralpc_db
```

#### Frontend (`apps/web/.env`) *(Opcional en desarrollo local)*
Por defecto apunta a `http://localhost:3000`. Si usas un puerto diferente:

```env
VITE_API_URL=http://localhost:3000
```

### 4. Instalar dependencias

Instala todas las dependencias del monorepo con `pnpm`:

```bash
pnpm install
```

### 5. Migraciones y Seed de datos iniciales

Aplica las migraciones SQL existentes y puebla la base de datos con usuarios y catálogo inicial:

```bash
# 1. Aplicar las migraciones de Drizzle a PostgreSQL
pnpm --filter @central-pc/database db:migrate

# 2. Insertar sucursal base, usuarios, clientes y productos de prueba
pnpm --filter @central-pc/database db:seed
```

### 6. Iniciar en desarrollo

Levanta todos los servicios concurrentemente con recarga en caliente (Hot Reload):

```bash
pnpm dev
```

Una vez iniciado el servidor:
* 🌐 **Frontend Web:** [http://localhost:5173](http://localhost:5173)
* ⚙️ **API tRPC:** [http://localhost:3000/trpc](http://localhost:3000/trpc)
* 📄 **Endpoint PDF:** `http://localhost:3000/api/orders/:id/pdf`

---

## 🔑 Credenciales de Prueba

Al ejecutar `db:seed`, se crean los siguientes usuarios con la contraseña por defecto `centralpc123`:

| Usuario | Rol | Contraseña | Permisos principales |
|---|---|---|---|
| `admin` | `admin` | `centralpc123` | Acceso global, configuración, gestión de usuarios y catálogo |
| `tecnico` | `tecnico` | `centralpc123` | Diagnóstico, recepción de equipos, actualización de estado técnico |
| `cajero` | `cajero` | `centralpc123` | Emisión de órdenes, cobranza, pagos y generación de comprobantes |

---

## 📜 Scripts Disponibles

### Globales (desde la raíz)

| Comando | Descripción |
|---|---|
| `pnpm dev` | Inicia todas las aplicaciones en modo desarrollo mediante Turborepo |
| `pnpm build` | Compila todos los paquetes y aplicaciones para producción |
| `pnpm lint` | Ejecuta el análisis estático de código en todo el monorepo |
| `pnpm test` | Ejecuta las suites de pruebas automatizadas con Vitest |

### Base de Datos (`packages/database`)

| Comando | Descripción |
|---|---|
| `pnpm --filter @central-pc/database db:generate` | Genera nuevas migraciones SQL a partir de cambios en los esquemas TypeScript |
| `pnpm --filter @central-pc/database db:migrate` | Ejecuta las migraciones pendientes en PostgreSQL |
| `pnpm --filter @central-pc/database db:studio` | Abre la interfaz web gráfica de **Drizzle Studio** |
| `pnpm --filter @central-pc/database db:seed` | Ejecuta el script de carga de datos iniciales |
| `pnpm --filter @central-pc/database test_connection` | Verifica la conectividad con la base de datos |

---

## 🌐 Arquitectura de la API (tRPC + REST PDF)

La API combina un endpoint tRPC fuertemente tipado para operaciones transaccionales junto con rutas HTTP Fastify para descargas binarias:

### Routers de tRPC (`/trpc/*`)
* **`auth`**: Login, registro de usuarios, listado de operadores.
* **`clients`**: Alta de clientes, búsqueda por DNI/RUC/nombre, consulta por ID.
* **`catalog`**: Creación y actualización de ítems, definición de combos y componentes.
* **`orders`**: Creación de órdenes (con detalle de dispositivos y servicios), cambio de estado, asignación técnica, anulación.
* **`payments`**: Registro de pagos y adelantos, histórico de pagos, anulación de transacciones.

### Rutas HTTP REST
* **`GET /api/orders/:id/pdf`**: Genera y transmite en tiempo real el comprobante PDF de la orden de servicio correspondiente. Requiere autenticación por token Bearer o cookie de sesión.

---

## 💻 Aplicación Web

La interfaz de usuario en `apps/web` ofrece una experiencia SPA fluida:

* **Autenticación:** Protección de rutas mediante TanStack Router layout `_authed` y redirección automática en caso de expiración del token.
* **Dashboard Principal:** Métricas rápidas y accesos directos de operación.
* **Gestión de Órdenes:** Listado paginado con filtros de estado, vista detallada del equipo y acción directa para descargar el comprobante en PDF.
* **Módulo de Clientes:** Búsqueda predictiva integrada en el flujo de creación de órdenes.
* **Catálogo:** Administración visual de componentes, precios y combos.

---

## 🧪 Pruebas Automatizadas

El proyecto utiliza **Vitest** para garantizar la integridad de las reglas de cálculo financiero y las validaciones de datos:

```bash
pnpm test
```

Los tests cubren:
* Validación de esquemas de órdenes (`order.schema.test.ts`).
* Cálculos de montos, saldos pendientes y pagos parciales (`financial-calculations.test.ts`).
* Reglas de validación para documentos de identidad y clientes (`clients.schema.test.ts`).
* Reglas de anulación y montos de pagos (`payments.schema.test.ts`).
* Utilidades y ciclo de vida de tokens de autenticación en frontend (`auth-helpers.test.ts`).

---

## 🚀 Despliegue en Producción

Para consultar la guía detallada paso a paso para el despliegue de la API y el Frontend Web en plataformas como **Coolify**, consulta el documento:

👉 **[Guía de Despliegue en Coolify](file:///home/navia/dev/centralPC-core/docs/deploy-coolify.md)**

### Consideraciones clave para producción:
1. Generar claves `JWT_SECRET` y `COOKIE_SECRET` criptográficamente seguras con `openssl rand -base64 32`.
2. Establecer `NODE_ENV=production` para activar logs en JSON estructurado (Pino nativo sin el overhead de `pino-pretty`).
3. Ejecutar las migraciones de base de datos antes de iniciar el contenedor de la API (`pnpm --filter @central-pc/database db:migrate`).
4. Definir la variable `VITE_API_URL` con el dominio real de la API durante la compilación del frontend (`pnpm build --filter=@centralpc/web...`).
