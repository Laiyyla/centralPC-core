CREATE TYPE "public"."estado_pago" AS ENUM('ACTIVO', 'ANULADO');--> statement-breakpoint
CREATE TYPE "public"."metodo_pago" AS ENUM('efectivo', 'yape', 'plin', 'tarjeta', 'transferencia');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"metodo" "metodo_pago" NOT NULL,
	"monto" numeric(10, 2) NOT NULL,
	"fecha_pago" timestamp DEFAULT now() NOT NULL,
	"estado" "estado_pago" DEFAULT 'ACTIVO' NOT NULL,
	"fecha_anulacion" timestamp,
	"usuario_anulacion_id" integer,
	"motivo_anulacion" text
);
--> statement-breakpoint
ALTER TABLE "branches" ADD COLUMN "ultimo_correlativo" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_usuario_anulacion_id_users_id_fk" FOREIGN KEY ("usuario_anulacion_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;