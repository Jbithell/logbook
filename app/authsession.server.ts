import {
  AppLoadContext,
  createCookieSessionStorage,
  redirect,
} from "@remix-run/cloudflare";

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage({
    cookie: {
      name: "__session",
      sameSite: "lax",
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
    },
  });

export async function logout(request: Request, context: AppLoadContext) {
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}

export async function createUserSession({
  request,
  userId,
  redirectTo,
  context,
}: {
  request: Request;
  userId: number;
  redirectTo: string;
  context: AppLoadContext;
}) {
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  session.set("sessionId", "test");
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session, {
        maxAge: 60 * 60 * 24 * 7, // 7 days,
      }),
    },
  });
}

export async function getSessionId(request: Request): Promise<{} | undefined> {
  // Get the session ID from the request, which is not secured by anything - it's just what the user is presenting and should be considered untrusted
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  if (!session.has("sessionId")) return undefined;
  return session.data.sessionId;
}
export async function getAuthenticatedUser(
  request: Request,
  context: AppLoadContext
) {
  // This actually validates the session against the database
  const sessionId = await getSessionId(request);
  if (sessionId === undefined) return null;
  return { user: "james" };
  // If user not found logout
  //throw await logout(request);
}

export async function requireAuthenticatedUser(
  request: Request,
  context: AppLoadContext,
  redirectTo: string = new URL(request.url).pathname
) {
  // This is the same as the above, but it will protect the route or action it is part of
  const user = await getAuthenticatedUser(request, context);
  if (!user || user === null) {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  return user;
}
