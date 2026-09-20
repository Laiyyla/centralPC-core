import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthUser } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Clipboard } from "lucide-react";

export const Route = createFileRoute("/_authed/dashboard")({
  component: RouteComponent,
  staticData: {
    title: "Dashboard",
  },
});

function RouteComponent() {
  const { user } = useAuthUser();

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <Card className="w-full max-w-lg shadow-sm">
        <CardContent className="flex flex-col items-center gap-6 py-12 px-8">
          {/* Avatar */}
          <div className="flex size-20 items-center justify-center rounded-2xl bg-primary text-white text-3xl font-bold">
            C
          </div>

          {/* Badge */}
          <Badge
            variant="outline"
            className="text-xs tracking-widest uppercase text-muted-foreground px-4 py-1"
          >
            CentralPC · Lima
          </Badge>

          {/* Texto */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-foreground">
              Hola, {user?.nombre?.split(" ")[0] ?? "—"}. ¿Empezamos el día?
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm">
              Gestiona el flujo de trabajo de CentralPC con eficiencia. Registra
              nuevas reparaciones y realiza seguimiento técnico.
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 mt-2">
            <Link to="/orders/new">
              <Button>
                <PlusCircle />
                Nueva Orden
              </Button>
            </Link>
            <Link to="/orders">
              <Button variant="outline">
                <Clipboard />
                Ver Órdenes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
