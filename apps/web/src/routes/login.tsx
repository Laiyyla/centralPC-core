import { useNavigate, createFileRoute, redirect } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@central-pc/schemas";
import type { LoginInput } from "@central-pc/schemas";
import { trpc } from "../trpc/client";

export const Route = createFileRoute("/login")({
  beforeLoad: () => {
    if (localStorage.getItem("token")) {
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
      localStorage.setItem("token", data.token);
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
      <button type="submit">Entrar</button>
    </form>
  );
}
