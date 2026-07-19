CREATE TYPE "public"."item_type" AS ENUM('servicio', 'producto', 'combo');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('PC', 'LAPTOP', 'IMPRESORA', 'CELULAR', 'OTROS');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('EMITIDA', 'ANULADA');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'tecnico', 'cajero');--> statement-breakpoint
CREATE TABLE "branches" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(100) NOT NULL,
	"serie" varchar(4) NOT NULL,
	"RUC" varchar(11) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "branches_serie_unique" UNIQUE("serie")
);
--> statement-breakpoint
CREATE TABLE "catalog_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"tipo_item" "item_type" NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"precio_referencial" numeric(10, 2) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"telefono" varchar(20) NOT NULL,
	"dni" varchar(8),
	"ruc" varchar(11)
);
--> statement-breakpoint
CREATE TABLE "combo_comp" (
	"id" serial PRIMARY KEY NOT NULL,
	"combo_id" integer NOT NULL,
	"comp_id" integer NOT NULL,
	"cantidad" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "devices" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"tipo_equipo" "device_type" NOT NULL,
	"descripcion" text NOT NULL,
	"observaciones" text
);
--> statement-breakpoint
CREATE TABLE "order_detail" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"equipo_id" integer,
	"item_id" integer,
	"nombre_snap" varchar(255) NOT NULL,
	"precio_unit_snap" numeric(10, 2) NOT NULL,
	"cantidad" integer NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"sucursal_id" integer NOT NULL,
	"correlativo" integer NOT NULL,
	"cliente_id" integer,
	"user_id" integer NOT NULL,
	"fecha_emision" timestamp DEFAULT now() NOT NULL,
	"estado" "order_status" NOT NULL,
	"total" numeric(10, 2) NOT NULL,
	"fecha_anulacion" timestamp,
	"user_anul" integer,
	"motivo_anulacion" text,
	"observaciones" text
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" varchar(255) NOT NULL,
	"user_name" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"rol" "user_role" NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	CONSTRAINT "users_user_name_unique" UNIQUE("user_name")
);
--> statement-breakpoint
ALTER TABLE "combo_comp" ADD CONSTRAINT "combo_comp_combo_id_catalog_items_id_fk" FOREIGN KEY ("combo_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combo_comp" ADD CONSTRAINT "combo_comp_comp_id_catalog_items_id_fk" FOREIGN KEY ("comp_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "devices" ADD CONSTRAINT "devices_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_detail" ADD CONSTRAINT "order_detail_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_detail" ADD CONSTRAINT "order_detail_equipo_id_devices_id_fk" FOREIGN KEY ("equipo_id") REFERENCES "public"."devices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_detail" ADD CONSTRAINT "order_detail_item_id_catalog_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."catalog_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_sucursal_id_branches_id_fk" FOREIGN KEY ("sucursal_id") REFERENCES "public"."branches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_cliente_id_clients_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_anul_users_id_fk" FOREIGN KEY ("user_anul") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;