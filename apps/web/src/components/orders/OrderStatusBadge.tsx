import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface OrderStatusBadgeProps {
  estado: string;
  className?: string;
}

export function OrderStatusBadge({ estado, className }: OrderStatusBadgeProps) {
  switch (estado) {
    case "RECEPCIONADA":
      return (
        <Badge
          className={cn(
            "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-300/40 dark:border-blue-700/40 font-medium",
            className
          )}
        >
          RECEPCIONADA
        </Badge>
      );
    case "EN_DIAGNOSTICO":
      return (
        <Badge
          className={cn(
            "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-300/40 dark:border-purple-700/40 font-medium",
            className
          )}
        >
          EN DIAGNÓSTICO
        </Badge>
      );
    case "ESPERANDO_APROBACION":
      return (
        <Badge
          className={cn(
            "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300/40 dark:border-amber-700/40 font-medium",
            className
          )}
        >
          ESPERANDO APROBACIÓN
        </Badge>
      );
    case "EN_REPARACION":
      return (
        <Badge
          className={cn(
            "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-300/40 dark:border-orange-700/40 font-medium",
            className
          )}
        >
          EN REPARACIÓN
        </Badge>
      );
    case "COMPLETADA":
      return (
        <Badge
          className={cn(
            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300/40 dark:border-emerald-700/40 font-medium",
            className
          )}
        >
          COMPLETADA
        </Badge>
      );
    case "ENTREGADA":
      return (
        <Badge
          className={cn(
            "bg-green-600/15 text-green-700 dark:text-green-300 border-green-300/40 dark:border-green-700/40 font-medium",
            className
          )}
        >
          ENTREGADA
        </Badge>
      );
    case "ANULADA":
      return (
        <Badge
          className={cn(
            "bg-red-500/15 text-red-700 dark:text-red-300 border-red-300/40 dark:border-red-700/40 font-medium",
            className
          )}
        >
          ANULADA
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {estado}
        </Badge>
      );
  }
}

/**
 * Función helper de compatibilidad hacia atrás
 */
export function getStatusBadge(estado: string) {
  return <OrderStatusBadge estado={estado} />;
}
