import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

function AuthedLayout() {
  return <Outlet />;
}

export const Route = createFileRoute("/_authed")({
  beforeLoad: () => {
    if (!localStorage.getItem("token")) {
      throw redirect({
        to: "/login",
      });
    }
  },

  component: AuthedLayout,
});
