import { createContext, useContext } from "react";

interface AuthUser {
  id: number;
  nombre: string;
  rol: string;
}

interface AuthContextValue {
  user: AuthUser | undefined;
}

export const AuthContext = createContext<AuthContextValue>({ user: undefined });

export function useAuthUser() {
  return useContext(AuthContext);
}
