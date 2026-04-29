export type AdminSession = {
  email: string;
  name?: string;
  domain?: string;
  token: string;
};

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  return token || null;
}

function getSessionCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") || "";
  for (const entry of cookieHeader.split(";")) {
    const [name, ...value] = entry.trim().split("=");
    if (name === "session_token" && value.length) {
      return value.join("=");
    }
  }
  return null;
}

export async function verifyAdminSession(request: Request) {
  const token = getBearerToken(request);
  const sessionCookie = getSessionCookie(request);
  if (!token && !sessionCookie) {
    return {
      ok: false as const,
      status: 401,
      error: "Missing admin session",
    };
  }

  const verifyUrl = process.env.ADMIN_AUTH_VERIFY_URL || "https://auth.omattic.com/verify";
  const headers: Record<string, string> = {};
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }
  if (sessionCookie) {
    headers.cookie = `session_token=${sessionCookie}`;
  }
  const response = await fetch(verifyUrl, {
    headers,
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: 401,
      error: `Auth verification failed with status ${response.status}`,
    };
  }

  const payload = await response.json().catch(() => ({}));
  if (!payload?.authenticated || !payload?.user?.email) {
    return {
      ok: false as const,
      status: 401,
      error: "JWT is not authenticated for admin access",
    };
  }

  return {
    ok: true as const,
    session: {
      email: `${payload.user.email}`.toLowerCase(),
      name: payload.user.name ? `${payload.user.name}` : undefined,
      domain: payload.user.domain ? `${payload.user.domain}` : undefined,
      token: token || sessionCookie || "",
    } satisfies AdminSession,
  };
}
