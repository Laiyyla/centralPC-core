import { createRootRoute, Outlet } from "@tanstack/react-router";
import { ThemeProvider } from "@/context/theme-context";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="centralpc-theme">
      <Outlet />
    </ThemeProvider>
  );
}
