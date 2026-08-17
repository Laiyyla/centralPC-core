import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/catalog/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/catalog/"!</div>
}
