import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { trpc, trpcClient } from "./trpc/client";
import { routeTree } from "./routeTree.gen";
import "./index.css";

const queryClient = new QueryClient();

export const router = createRouter({
  routeTree: routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
});

// const rootElement = document.getElementById("app");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </trpc.Provider>
  </StrictMode>,
);
