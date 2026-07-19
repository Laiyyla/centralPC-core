# centralPC-core

Este es el repositorio central (**monorepo**) para **centralPC**, una plataforma para la gestión de sucursales, clientes, catálogo, dispositivos y pedidos de ensambles o componentes de computadoras. 

El proyecto está estructurado como un monorepo administrado con **Turborepo** y **pnpm Workspaces**, diseñado para escalar con facilidad y compartir código de forma eficiente entre el backend, base de datos y futuros frontends.

---

## 🛠️ Tecnologías y Herramientas

*   **Gestor de Monorepo:** [Turborepo](https://turbo.build/) + [pnpm Workspaces](https://pnpm.io/workspaces)
*   **Lenguaje:** [TypeScript](https://www.typescriptlang.org/)
*   **Servidor API:** [Fastify](https://fastify.dev/) + [tRPC v11](https://trpc.io/) (para comunicación segura del tipo End-to-End con el frontend)
*   **Base de Datos / ORM:** [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
*   **Ejecución en Desarrollo:** [tsx](https://github.com/privatenumber/tsx) (TypeScript Execute)

---

## 📁 Estructura del Proyecto

El monorepo está dividido en dos directorios principales: `apps` (aplicaciones ejecutables) y `packages` (módulos y librerías compartidas):

```text
centralPC-core/
├── apps/
│   ├── api/                 # Servidor Fastify con endpoints tRPC
│   └── web/                 # Aplicación Web cliente (placeholder para frontend)
├── packages/
│   ├── database/            # Configuración de Drizzle ORM, esquemas y migraciones SQL
│   ├── shared/              # Código y utilidades comunes (placeholder)
│   └── tsconfig/            # Configuraciones base de TypeScript heredables
├── package.json             # Dependencias raíz y scripts globales
├── pnpm-workspace.yaml      # Definición de los workspaces de pnpm
└── turbo.json               # Configuración de pipelines de Turborepo
```

---

## 🚀 Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu entorno:

1.  **Node.js** (versión 20 o superior recomendada)
2.  **pnpm** (versión `^11.9.0` o superior, declarada como package manager del proyecto)
3.  Una instancia de base de datos **PostgreSQL** activa.

---

## ⚙️ Configuración Inicial

Sigue estos pasos para levantar el entorno local:

### 1. Clonar el repositorio e instalar dependencias

Ejecuta el siguiente comando en la raíz del proyecto para descargar e instalar todas las dependencias de los distintos workspaces:

```bash
pnpm install
```

### 2. Configurar Variables de Entorno

Debes configurar las credenciales y puertos correspondientes en los archivos `.env`. 

Crea un archivo `.env` en la raíz de las siguientes ubicaciones:

*   **En `apps/api/.env`**:
    ```env
    DATABASE_URL=postgres://usuario:contraseña@localhost:5432/centralpc_db
    SERVER_PORT=3000
    JWT_SECRET=tuFraseSuperSecretaDeJWT
    ```

*   **En `packages/database/.env`** (para poder ejecutar las migraciones de Drizzle):
    ```env
    DATABASE_URL=postgres://usuario:contraseña@localhost:5432/centralpc_db
    ```

> [!IMPORTANT]
> Nunca hagas commit de los archivos `.env` reales. Estos ya están listados en el archivo `.gitignore`.

---

## 🗄️ Base de Datos con Drizzle ORM

El paquete `@central-pc/database` centraliza el acceso a la base de datos PostgreSQL utilizando Drizzle.

### Esquema de la base de datos
Los esquemas se dividen por entidades en `packages/database/src/schema/`:
*   `users.ts` (Usuarios / Personal)
*   `branches.ts` (Sucursales)
*   `clients.ts` (Clientes)
*   `catalog.ts` (Catálogo de productos/componentes)
*   `devices.ts` (Equipos y dispositivos)
*   `combo_components.ts` (Componentes y combos)
*   `orders.ts` & `order_details.ts` (Ordenes de compra o ensambles)

### Comandos de base de datos
Debes ejecutar estos comandos desde la raíz del proyecto usando el filtro de `pnpm`:

*   **Generar nuevas migraciones SQL (basadas en cambios del esquema TypeScript):**
    ```bash
    pnpm --filter @central-pc/database db:generate
    ```
*   **Aplicar las migraciones a la base de datos PostgreSQL:**
    ```bash
    pnpm --filter @central-pc/database db:migrate
    ```
*   **Abrir la interfaz visual de Drizzle Studio para ver/editar datos:**
    ```bash
    pnpm --filter @central-pc/database db:studio
    ```

---

## 💻 Desarrollo Local

Para iniciar el entorno de desarrollo con recarga en caliente de todos los workspaces a la vez:

```bash
pnpm dev
```

Este comando levanta:
*   El servidor de la **API tRPC** en `http://localhost:3000` (o el puerto configurado en `SERVER_PORT`).

---

## 🛠️ Tareas y Scripts de Producción

Turborepo gestiona las tareas en paralelo de forma eficiente guardando caché de los builds que no han sufrido modificaciones.

*   **Compilar el proyecto completo para producción:**
    ```bash
    pnpm build
    ```
*   **Ejecutar los linters en todos los paquetes:**
    ```bash
    pnpm lint
    ```
