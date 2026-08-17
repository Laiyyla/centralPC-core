import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/orders/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/orders/new"!</div>
}
