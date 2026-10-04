import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({
      to: "/login", // Cambia esto por tu ruta por defecto
      replace: true,
    });
  },
});
