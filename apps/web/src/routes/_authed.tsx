import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { isUserAuthenticated } from "@/lib/api";

function AuthedLayout() {
  return <Outlet />;
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
