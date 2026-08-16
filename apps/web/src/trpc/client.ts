import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@central-pc/api";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "http://localhost:3000/trpc",
      transformer: superjson,
      headers() {
        const token = localStorage.getItem("token");
        if (token) {
          return { Authorization: `Bearer ${token}` };
        } else {
          return {};
        }
      },
    }),
  ],
});
