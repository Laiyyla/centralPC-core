import { useNavigate, createFileRoute, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@central-pc/schemas";
import type { LoginInput } from "@central-pc/schemas";
import { trpc } from "@/trpc/client";
import { isUserAuthenticated, setToken } from "@/lib/api";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (isUserAuthenticated()) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },

  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();

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
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register("user_name")} placeholder="Usuario" />
      <input
        {...form.register("password")}
        type="password"
        placeholder="Contraseña"
      />
      <button type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Entrando..." : "Entrar"}
      </button>
      {loginMutation.isError && (
        <p style={{ color: "red" }}>{loginMutation.error.message}</p>
      )}
    </form>
  );
}
