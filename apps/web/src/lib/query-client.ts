import { QueryClient, QueryCache, MutationCache } from "@tanstack/react-query";

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler): void {
  unauthorizedHandler = handler;
}

interface TrpcErrorLike {
  data?: { code?: string };
  message?: string;
  status?: number;
}

function isUnauthorizedError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const errObj = error as TrpcErrorLike;
  return (
    errObj.data?.code === "UNAUTHORIZED" ||
    (typeof errObj.message === "string" &&
      errObj.message.includes("UNAUTHORIZED")) ||
    errObj.status === 401
  );
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        unauthorizedHandler?.();
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        unauthorizedHandler?.();
      }
    },
  }),
});
