export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || "http://localhost:3000";
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
    const payload = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
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
  if (!token) {
    handleUnauthorized();
    return;
  }

  const apiUrl = getApiUrl();
  const response = await fetch(`${apiUrl}/api/orders/${orderId}/pdf`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
  window.open(blobUrl, "_blank");
}
