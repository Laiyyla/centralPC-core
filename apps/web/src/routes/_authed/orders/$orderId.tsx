import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/orders/$orderId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/orders/$orderId"!</div>
}
