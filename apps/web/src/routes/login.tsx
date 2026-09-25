import { useNavigate, createFileRoute, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@central-pc/schemas";
import type { LoginInput } from "@central-pc/schemas";
import { trpc } from "@/trpc/client";
import { isUserAuthenticated, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CpuIcon,
  UserIcon,
  LockIcon,
  ArrowRightIcon,
  EyeIcon,
  EyeOffIcon,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (isUserAuthenticated()) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: LoginPage,
  staticData: {
    title: "Login",
  },
});

function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      setToken(data.token);
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      console.error(error.message);
    },
  });

  function onSubmit(values: LoginInput) {
    loginMutation.mutate(values);
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-md">
          <CardContent className="pt-8 pb-6 px-8 flex flex-col gap-6">
            {/* Logo + título */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary">
                <CpuIcon className="size-7 text-white" />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-foreground">
                  Bienvenido
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Ingresa tus credenciales para continuar
                </p>
              </div>
            </div>

            {/* Formulario */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-4"
            >
              {/* Usuario */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  Usuario
                </Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    {...form.register("user_name")}
                    placeholder="nombre.apellido"
                    className="pl-9"
                    disabled={loginMutation.isPending}
                  />
                </div>
              </div>

              {/* Contraseña */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-semibold tracking-widest uppercase text-muted-foreground">
                  Contraseña
                </Label>
                <div className="relative">
                  <LockIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    {...form.register("password")}
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-9 pr-9"
                    disabled={loginMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOffIcon className="size-4" />
                    ) : (
                      <EyeIcon className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error */}
              {loginMutation.isError && (
                <Alert variant="destructive">
                  <AlertDescription>
                    {loginMutation.error.message}
                  </AlertDescription>
                </Alert>
              )}

              {/* Submit */}
              <Button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full mt-1"
              >
                {loginMutation.isPending ? (
                  "Entrando..."
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRightIcon className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>

          {/* Footer */}
          <CardFooter className="flex flex-col items-center gap-1 pb-6 px-8">
            <Separator />
            <p className="text-xs text-muted-foreground text-center mt-4">
              CentralPC © 2026. Sistema de Gestión para Centros de Reparación
              Informática.
            </p>
            <p className="text-xs font-mono text-muted-foreground/50 tracking-widest uppercase">
              MIKU-2B-MOON // build 0039 · En servicio · La grasa no miente
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
