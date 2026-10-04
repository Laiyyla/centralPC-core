export function getApiUrl(): string {
  const url = import.meta.env.VITE_API_URL;
  if (!url && import.meta.env.PROD) {
    throw new Error("CRITICAL: VITE_API_URL is not defined in production environment.");
  }
  return url || "http://localhost:3000";
}

export function getToken(): string | null {
  return localStorage.getItem("token");
}

export function setToken(token: string): void {
  localStorage.setItem("token", token);
}

export function removeToken(): void {
  localStorage.removeItem("token");
}

export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

export function isUserAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  if (isTokenExpired(token)) {
    removeToken();
    return false;
  }
  return true;
}

export function handleUnauthorized(): void {
  removeToken();
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

export async function openOrderPdf(orderId: number): Promise<void> {
  const token = getToken();
  const apiUrl = getApiUrl();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${apiUrl}/api/orders/${orderId}/pdf`, {
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error("Sesión expirada o no autorizada");
  }

  if (!response.ok) {
    throw new Error(`Error al generar PDF (código ${response.status})`);
  }

  const blob = await response.blob();
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, "_blank", "noopener,noreferrer");

  setTimeout(() => {
    URL.revokeObjectURL(blobUrl);
  }, 10000);
}
