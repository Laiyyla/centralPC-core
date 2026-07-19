import {z} from "zod";


export const registerSchema = z.object({
  nombre: z.string().max(255, "Cantidad maxima de caracteres superada").min(1,"El nombre no puede estar vacío"),
  user_name: z.string().max(100, "Cantidad maxima de caracteres superada").min(1, "El nombre de usuario no puede estar vacio"),
  password: z.string().max(100, "Cantidad maxima de caracteres superada").min(1, "Ingrese una contraseña valida"),
  rol: z.enum(["admin", "tecnico", "cajero"])
})

export const loginSchema = z.object({
  user_name: z.string().min(1, "Ingrese un Nombre de Usuario"),
  password: z.string().min(1, "Ingrese una Contraseña")
})


export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
