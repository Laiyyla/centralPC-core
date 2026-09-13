import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div>
      <h1>Dashboard working</h1>
    </div>
  );
}
