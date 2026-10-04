ALTER TABLE "orders" ALTER COLUMN "estado" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('RECEPCIONADA', 'EN_DIAGNOSTICO', 'ESPERANDO_APROBACION', 'EN_REPARACION', 'COMPLETADA', 'ENTREGADA', 'ANULADA');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "estado" SET DATA TYPE "public"."order_status" USING "estado"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "encargado_id" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_encargado_id_users_id_fk" FOREIGN KEY ("encargado_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;