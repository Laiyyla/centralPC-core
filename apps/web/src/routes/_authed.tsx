import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isUserAuthenticated, removeToken } from "@/lib/api";
import { AuthContext } from "@/context/auth-context";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  Sidebar,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Link, useMatches, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  PlusCircle,
  Clipboard,
  User2Icon,
  PackageIcon,
  LogOutIcon,
  CpuIcon,
  UsersIcon,
} from "lucide-react";
import { Toaster } from "sonner";
import { trpc } from "@/trpc/client";
import { ThemeToggle } from "@/components/ui/theme-toggle";

function AuthedLayout() {
  const matches = useMatches();
  const navigate = useNavigate();
  const currentTitle = (
    matches[matches.length - 1]?.staticData as { title?: string } | undefined
  )?.title;
  const { data: user } = trpc.auth.me.useQuery();

  const initials = user?.nombre
    ? user.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <AuthContext.Provider value={{ user }}>
      <Toaster
        position="top-right"
        richColors
        closeButton
        duration={3500}
        toastOptions={{ style: { fontFamily: "inherit" } }}
      ></Toaster>
      <SidebarProvider>
        <Sidebar
          side="left"
          variant="sidebar"
          collapsible="icon"
          className="border-r border-sidebar-border"
        >
          {/* Header */}
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 transition-all duration-200">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-sm shadow-primary/30">
                <CpuIcon className="size-4 text-white" />
              </div>
              <span className="truncate font-bold text-sidebar-foreground group-data-[collapsible=icon]:hidden tracking-wide">
                Central PC
              </span>
            </div>
          </SidebarHeader>

          <Separator className="bg-sidebar-border" />

          {/* Nav */}
          <SidebarContent className="py-2">
            <SidebarMenu className="space-y-1 px-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/dashboard" />}
                  tooltip="Dashboard"
                  className="text-sidebar-foreground/75 hover:text-sidebar-foreground"
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/orders/new" />}
                  tooltip="Nueva Orden"
                  className="text-sidebar-foreground/75 hover:text-sidebar-foreground"
                >
                  <PlusCircle />
                  <span>Nueva Orden</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/orders" />}
                  tooltip="Listar Órdenes"
                  className="text-sidebar-foreground/75 hover:text-sidebar-foreground"
                >
                  <Clipboard />
                  <span>Listar Órdenes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/clients" />}
                  tooltip="Clientes"
                  className="text-sidebar-foreground/75 hover:text-sidebar-foreground"
                >
                  <User2Icon />
                  <span>Clientes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/catalog" />}
                  tooltip="Catálogo"
                  className="text-sidebar-foreground/75 hover:text-sidebar-foreground"
                >
                  <PackageIcon />
                  <span>Catálogo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.rol === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link to="/users" />}
                    tooltip="Usuarios"
                    className="text-sidebar-foreground/75 hover:text-sidebar-foreground"
                  >
                    <UsersIcon />
                    <span>Usuarios</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarContent>

          <Separator className="bg-sidebar-border" />

          {/* Footer */}
          <SidebarFooter className="py-3 px-2">
            {/* User info */}
            <div className="flex items-center gap-3 px-2 py-1 group-data-[collapsible=icon]:justify-center transition-all duration-200">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm shadow-primary/20">
                {initials}
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold text-sidebar-foreground truncate">
                  {user?.nombre ?? "—"}
                </span>
                <span className="text-xs text-sidebar-foreground/60 truncate capitalize">
                  {user?.rol ?? "—"}
                </span>
              </div>
            </div>

            {/* Cerrar sesión */}
            <SidebarMenu className="mt-1">
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => {
                    removeToken();
                    navigate({ to: "/login" });
                  }}
                  className="text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
                  tooltip="Cerrar Sesión"
                >
                  <LogOutIcon />
                  <span>Cerrar Sesión</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Main */}
        <div className="flex flex-col w-full min-h-screen">
          {/* Topbar */}
          <div className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-10 h-14 flex items-center justify-between px-4 transition-colors">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="font-semibold text-foreground">
                {currentTitle}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Separator orientation="vertical" className="h-6" />
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm shadow-primary/20">
                {initials}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground leading-tight">
                  {user?.nombre ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground leading-tight capitalize">
                  {user?.rol ?? "—"}
                </span>
              </div>
            </div>
          </div>

          <main className="p-6">
            <Outlet />
          </main>
        </div>
      </SidebarProvider>
    </AuthContext.Provider>
  );
}

export const Route = createFileRoute("/_authed")({
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AuthedLayout,
});
