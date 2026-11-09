import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@central-pc/schemas";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { UserPlusIcon, UsersIcon, ShieldAlertIcon } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authed/users/")({
  component: UsersPage,
  staticData: {
    title: "Gestión de Usuarios",
  },
});

function UsersPage() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: currentUser, isLoading: isLoadingMe } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();

  const {
    data: users,
    isLoading: isLoadingUsers,
    isError,
  } = trpc.auth.listUsers.useQuery(undefined, {
    enabled: currentUser?.rol === "admin",
  });

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nombre: "",
      user_name: "",
      password: "",
      rol: "tecnico",
    },
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      toast.success("Usuario Creado", {
        description: `El usuario "${data.user_name}" ha sido registrado correctamente.`,
      });
      form.reset();
      setIsModalOpen(false);
      utils.auth.listUsers.invalidate();
    },
    onError: (err) => {
      toast.error("Error al registrar", {
        description: err.message,
      });
    },
  });

  function onSubmit(values: RegisterInput) {
    registerMutation.mutate(values);
  }

  if (isLoadingMe) {
    return <TableSkeleton rows={5} cols={4} />;
  }

  if (currentUser?.rol !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
        <ShieldAlertIcon className="size-14 text-destructive" />
        <h2 className="text-xl font-bold">Acceso Denegado</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          Esta sección está restringida exclusivamente a usuarios con rol de
          administrador.
        </p>
        <Button variant="outline" onClick={() => navigate({ to: "/dashboard" })}>
          Volver al Dashboard
        </Button>
      </div>
    );
  }

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case "admin":
        return <Badge className="bg-primary text-primary-foreground">Admin</Badge>;
      case "tecnico":
        return (
          <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/40">
            Técnico
          </Badge>
        );
      case "cajero":
        return (
          <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/40">
            Cajero
          </Badge>
        );
      default:
        return <Badge variant="outline">{rol}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Gestión de Usuarios
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra las cuentas y roles del personal con acceso al sistema.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 self-start sm:self-auto">
          <UserPlusIcon className="size-4" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Error state */}
      {isError && (
        <Alert variant="destructive">
          <AlertDescription>Error al cargar la lista de usuarios.</AlertDescription>
        </Alert>
      )}

      {/* Tabla */}
      {isLoadingUsers ? (
        <TableSkeleton rows={5} cols={3} />
      ) : !users || users.length === 0 ? (
        <EmptyState
          icon={<UsersIcon className="size-8 text-muted-foreground" />}
          title="No hay usuarios registrados"
          description="Crea el primer usuario usando el botón superior."
        />
      ) : (
        <div className="rounded-lg border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Nombre de Usuario</TableHead>
                <TableHead>Rol</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium text-foreground">
                    {u.nombre}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {u.user_name}
                  </TableCell>
                  <TableCell>{getRoleBadge(u.rol)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal de Registro */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Crea una cuenta para un colaborador especificando su rol en el sistema.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 mt-2">
            {/* Nombre */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="nombre" className="text-xs font-semibold">
                Nombre Completo
              </Label>
              <Input
                id="nombre"
                placeholder="Ej. Juan Pérez"
                {...form.register("nombre")}
                disabled={registerMutation.isPending}
              />
              {form.formState.errors.nombre && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.nombre.message}
                </p>
              )}
            </div>

            {/* Usuario */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="user_name" className="text-xs font-semibold">
                Nombre de Usuario (Login)
              </Label>
              <Input
                id="user_name"
                placeholder="Ej. juan.perez"
                {...form.register("user_name")}
                disabled={registerMutation.isPending}
              />
              {form.formState.errors.user_name && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.user_name.message}
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password" className="text-xs font-semibold">
                Contraseña Temporal
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...form.register("password")}
                disabled={registerMutation.isPending}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {/* Rol */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="rol" className="text-xs font-semibold">
                Rol
              </Label>
              <Controller
                control={form.control}
                name="rol"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      if (val) field.onChange(val as "admin" | "tecnico" | "cajero");
                    }}
                    disabled={registerMutation.isPending}
                  >
                    <SelectTrigger id="rol" className="w-full">
                      <SelectValue placeholder="Seleccione un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="tecnico">Técnico</SelectItem>
                      <SelectItem value="cajero">Cajero</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.rol && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.rol.message}
                </p>
              )}
            </div>

            {/* Botones */}
            <div className="flex justify-end gap-2 mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                disabled={registerMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Guardando..." : "Crear Usuario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
