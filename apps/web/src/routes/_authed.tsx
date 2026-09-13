import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isUserAuthenticated } from "@/lib/api";
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  SidebarContent,
  Sidebar,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarGroupAction,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";

function AuthedLayout() {
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="text-primary font-bold">
          CentralPC
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarGroup>
              <SidebarGroupLabel>Ordenes</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link to="/orders" />}>
                      Listar Ordenes
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuButton render={<Link to="/orders/new" />}>
                    Nueva Orden
                  </SidebarMenuButton>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            <SidebarGroup>
              <SidebarGroupLabel>Clientes</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton render={<Link to="/clients" />}>
                      Listar Clientes
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <Outlet />
    </SidebarProvider>
  );
}

export const Route = createFileRoute("/_authed")({
  beforeLoad: () => {
    if (!isUserAuthenticated()) {
      throw redirect({
        to: "/login",
      });
    }
  },

  component: AuthedLayout,
});
