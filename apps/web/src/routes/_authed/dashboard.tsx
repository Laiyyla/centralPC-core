import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuthUser } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Clipboard, Cpu, Sparkles } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/_authed/dashboard")({
  component: RouteComponent,
  staticData: {
    title: "Dashboard",
  },
});

const TECH_GREETINGS = [
  "Que hoy no llegue ninguna PC con pasta térmica de hace 10 años.",
  "Recuerda: 'It's not a bug, it's an undocumented feature'.",
  "Calibrando capacitores y optimizando diagnósticos.",
  "La grasa térmica no miente. ¡A reparar con precisión!",
  "Shinji, súbete al taller y atiende esa orden técnica.",
  "Compilado sin errores y listos para diagnosticar hardware.",
  "El firmware está listo y los transistores alineados.",
];

function RouteComponent() {
  const { user } = useAuthUser();

  const greeting = useMemo(() => {
    const index = Math.floor(Math.random() * TECH_GREETINGS.length);
    return TECH_GREETINGS[index];
  }, []);

  const firstName = user?.nombre?.split(" ")[0] ?? "—";

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)] py-8">
      <Card className="w-full max-w-lg border-border/80 shadow-lg shadow-primary/5 relative overflow-hidden group">
        {/* Glow sutil en esquina */}
        <div className="absolute -top-16 -right-16 size-36 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-2xl pointer-events-none" />

        <CardContent className="flex flex-col items-center gap-6 py-12 px-8 relative z-10">
          {/* Avatar con gradiente Cyber-Sleek */}
          <div className="relative group-hover:scale-105 transition-transform duration-300">
            <div className="flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground text-3xl font-extrabold shadow-lg shadow-primary/25">
              <Cpu className="size-10 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-background border-2 border-background">
              <span className="size-2.5 rounded-full bg-emerald-500 animate-ping absolute opacity-75" />
              <span className="size-2 rounded-full bg-emerald-500" />
            </span>
          </div>

          {/* Badge de estado del sistema */}
          <Badge
            variant="outline"
            className="text-[11px] tracking-widest uppercase font-mono text-muted-foreground px-3 py-1 flex items-center gap-1.5 border-primary/20 bg-primary/5"
          >
            <Sparkles className="size-3 text-accent" />
            CentralPC · Lima // Online
          </Badge>

          {/* Texto de Bienvenida */}
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Hola, {firstName}. ¿Listo para el taller?
            </h1>
            <p className="text-muted-foreground text-sm max-w-sm font-medium">
              {greeting}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-3 mt-2">
            <Link to="/orders/new">
              <Button className="shadow-md shadow-primary/20">
                <PlusCircle className="mr-1" />
                Nueva Orden
              </Button>
            </Link>
            <Link to="/orders">
              <Button variant="outline" className="border-border">
                <Clipboard className="mr-1" />
                Ver Órdenes
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
