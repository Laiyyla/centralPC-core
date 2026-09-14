import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isUserAuthenticated, removeToken } from "@/lib/api";
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
  LucideHome,
  PlusCircle,
  Clipboard,
  User2Icon,
  PackageIcon,
  LogOutIcon,
} from "lucide-react";

function AuthedLayout() {
  const matches = useMatches();
  const navigate = useNavigate();
  const currentTitle = matches[matches.length - 1]?.staticData.title;
  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="icon">
        <SidebarHeader className="text-primary font-bold p-2">
          <span>Central PC</span>
        </SidebarHeader>
        <Separator className="mb-2 mt-2"></Separator>
        <SidebarContent>
          <SidebarMenu className="space-y-2.5 p-1">
            <SidebarMenuItem className="p-1">
              <SidebarMenuButton render={<Link to="/dashboard"></Link>}>
                <LucideHome />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="p-1">
              <SidebarMenuButton render={<Link to="/orders/new"></Link>}>
                <PlusCircle></PlusCircle>
                <span>Nueva Order</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="p-1">
              <SidebarMenuButton render={<Link to="/orders"></Link>}>
                <Clipboard></Clipboard>
                <span>Listar Ordenes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="p-1">
              <SidebarMenuButton render={<Link to="/clients"></Link>}>
                <User2Icon></User2Icon>
                <span>Clientes</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem className="p-1">
              <SidebarMenuButton render={<Link to="/catalog"></Link>}>
                <PackageIcon></PackageIcon>
                <span>Catálogo</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
        <Separator className="mb-1"></Separator>
        <SidebarFooter>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => {
                removeToken();
                navigate({ to: "/login" });
              }}
              className=" text-muted-foreground hover:text-destructive"
            >
              <LogOutIcon></LogOutIcon>
              <span>Cerrar Sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarFooter>
      </Sidebar>
      <div className="flex flex-col w-full">
        <div className="border-b bg-surface w-full h-14 flex items-center justify-between px-4">
          <SidebarTrigger></SidebarTrigger>
          <div>{currentTitle}</div>
        </div>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
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
