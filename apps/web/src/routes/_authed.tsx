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
} from "lucide-react";
import { trpc } from "@/trpc/client";

function AuthedLayout() {
  const matches = useMatches();
  const navigate = useNavigate();
  const currentTitle = matches[matches.length - 1]?.staticData.title;
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
      <SidebarProvider>
        <Sidebar
          side="left"
          variant="sidebar"
          collapsible="icon"
          className="bg-[#1a1a2e] text-white border-r-0"
        >
          {/* Header */}
          <SidebarHeader>
            <div className="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary">
                <CpuIcon className="size-4 text-white" />
              </div>
              <span className="truncate font-bold text-white group-data-[collapsible=icon]:hidden">
                Central PC
              </span>
            </div>
          </SidebarHeader>

          <Separator className="bg-white/10" />

          {/* Nav */}
          <SidebarContent className="py-2">
            <SidebarMenu className="space-y-1 px-2">
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/dashboard" />}
                  tooltip="Dashboard"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <LayoutDashboard />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/orders/new" />}
                  tooltip="Nueva Orden"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <PlusCircle />
                  <span>Nueva Orden</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/orders" />}
                  tooltip="Listar Órdenes"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <Clipboard />
                  <span>Listar Órdenes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/clients" />}
                  tooltip="Clientes"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <User2Icon />
                  <span>Clientes</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link to="/catalog" />}
                  tooltip="Catálogo"
                  className="text-white/70 hover:text-white hover:bg-white/10"
                >
                  <PackageIcon />
                  <span>Catálogo</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>

          <Separator className="bg-white/10" />

          {/* Footer */}
          <SidebarFooter className="py-3 px-2">
            {/* User info */}
            <div className="flex items-center gap-3 px-2 py-1 group-data-[collapsible=icon]:justify-center">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
                {initials}
              </div>
              <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                <span className="text-sm font-semibold text-white truncate">
                  {user?.nombre ?? "—"}
                </span>
                <span className="text-xs text-white/50 truncate capitalize">
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
                  className="text-white/40 hover:text-destructive hover:bg-white/10"
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
        <div className="flex flex-col w-full">
          {/* Topbar */}
          <div className="border-b bg-surface h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <span className="font-semibold text-foreground">
                {currentTitle}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold">
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
