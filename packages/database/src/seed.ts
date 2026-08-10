import { getDb } from "./db.js";
import {
  branchTable,
  usersTable,
  clientTable,
  catalogTable,
} from "./schema/index.js";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const db = getDb();
async function seed() {
  console.log("🌱 Iniciando seed...");

  // 1. Sucursal principal
  console.log("📍 Creando sucursal...");
  const [sucursal] = await db
    .insert(branchTable)
    .values({
      nombre: "Local Principal",
      serie: "B001",
      RUC: "12345678901",
      isActive: true,
      ultimo_correlativo: 0,
    })
    .returning();
  console.log("✅ Sucursal creada:", sucursal.id);

  // 2. Usuarios
  console.log("👤 Creando usuarios...");
  const passwordHash = await bcrypt.hash("centralpc123", 10);

  const usuarios = await db
    .insert(usersTable)
    .values([
      {
        nombre: "Administrador Central",
        user_name: "admin",
        password_hash: passwordHash,
        rol: "admin",
        isActive: true,
      },
      {
        nombre: "Técnico Principal",
        user_name: "tecnico",
        password_hash: passwordHash,
        rol: "tecnico",
        isActive: true,
      },
      {
        nombre: "Cajero",
        user_name: "cajero",
        password_hash: passwordHash,
        rol: "cajero",
        isActive: true,
      },
    ])
    .returning();
  console.log(
    "✅ Usuarios creados:",
    usuarios.map((u) => u.user_name).join(", "),
  );

  // 3. Clientes
  console.log("👥 Creando clientes...");
  const clientes = await db
    .insert(clientTable)
    .values([
      {
        nombre: "Juan Pérez García",
        telefono: "987654321",
        dni: "12345678",
        ruc: null,
      },
      {
        nombre: "María López Torres",
        telefono: "987654322",
        dni: "87654321",
        ruc: null,
      },
      {
        nombre: "Carlos Rodríguez",
        telefono: "987654323",
        dni: null,
        ruc: null,
      },
      {
        nombre: "Ana Martínez",
        telefono: "987654324",
        dni: "45678912",
        ruc: "10456789123",
      },
      {
        nombre: "Pedro Sánchez",
        telefono: "987654325",
        dni: "78912345",
        ruc: null,
      },
    ])
    .returning();
  console.log("✅ Clientes creados:", clientes.length);

  // 4. Catálogo (servicios, productos, combos)
  console.log("📦 Creando catálogo...");
  const catalogo = await db
    .insert(catalogTable)
    .values([
      // Servicios
      {
        nombre: "Diagnóstico general",
        precio_ref: "50.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Cambio de pantalla",
        precio_ref: "150.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Limpieza interna",
        precio_ref: "80.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Instalación de software",
        precio_ref: "60.00",
        tipo_item: "servicio",
        isActive: true,
      },
      {
        nombre: "Reparación de placa",
        precio_ref: "300.00",
        tipo_item: "servicio",
        isActive: true,
      },

      // Productos
      {
        nombre: "Pantalla Laptop 15.6 genérica",
        precio_ref: "350.00",
        tipo_item: "producto",
        isActive: true,
      },
      {
        nombre: "Teclado Laptop HP",
        precio_ref: "120.00",
        tipo_item: "producto",
        isActive: true,
      },
      {
        nombre: "Disco SSD 240GB",
        precio_ref: "180.00",
        tipo_item: "producto",
        isActive: true,
      },
      {
        nombre: "Memoria RAM 8GB DDR4",
        precio_ref: "150.00",
        tipo_item: "producto",
        isActive: true,
      },
      {
        nombre: "Fuente de poder 500W",
        precio_ref: "200.00",
        tipo_item: "producto",
        isActive: true,
      },
      {
        nombre: "Mouse USB genérico",
        precio_ref: "25.00",
        tipo_item: "producto",
        isActive: true,
      },
      {
        nombre: "Cable HDMI 2m",
        precio_ref: "30.00",
        tipo_item: "producto",
        isActive: true,
      },

      // Combos
      {
        nombre: "Cambio de pantalla + Instalación",
        precio_ref: "200.00",
        tipo_item: "combo",
        isActive: true,
      },
      {
        nombre: "Mantenimiento completo",
        precio_ref: "250.00",
        tipo_item: "combo",
        isActive: true,
      },
    ])
    .returning();
  console.log("✅ Catálogo creado:", catalogo.length, "ítems");

  console.log("🎉 Seed completado exitosamente!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Error en seed:", err);
  process.exit(1);
});
