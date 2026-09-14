import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
  staticData: {
    title: "Dashboard",
  },
});

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard working</h1>
    </div>
  );
}
