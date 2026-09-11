import { httpBatchLink, TRPCClientError } from "@trpc/client";
import superjson from "superjson";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@central-pc/api";
import { getApiUrl, getToken, handleUnauthorized } from "@/lib/api";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: `${getApiUrl()}/trpc`,
      transformer: superjson,
      headers() {
        const token = getToken();
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
        return {};
      },
    }),
  ],
});

export function handleTrpcError(error: unknown) {
  if (error instanceof TRPCClientError) {
    if (error.data?.code === "UNAUTHORIZED" || error.message.includes("UNAUTHORIZED")) {
      handleUnauthorized();
    }
  }
}
