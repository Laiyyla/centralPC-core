import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/theme-context";
import { Button } from "@/components/ui/button";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className={className}
      aria-label="Cambiar tema"
      title={
        resolvedTheme === "dark"
          ? "Cambiar a modo claro"
          : "Cambiar a modo oscuro"
      }
    >
      {resolvedTheme === "dark" ? (
        <Sun className="size-4 text-amber-300 transition-transform duration-200 hover:rotate-45" />
      ) : (
        <Moon className="size-4 text-primary transition-transform duration-200 hover:-rotate-12" />
      )}
    </Button>
  );
}
