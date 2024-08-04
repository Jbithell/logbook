import {
  AppLoadContext,
  createCookieSessionStorage,
  redirect,
} from "@remix-run/cloudflare";
import { and, between, eq, InferSelectModel, ne, sql } from "drizzle-orm";
import { db } from "../d1client.server";
import { AuthSessions } from "../db/schema/AuthSessions";
import { Users } from "../db/schema/Users";

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
  if (!userId || typeof userId !== "number" || userId < 1)
    throw new Error("User not found");
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  const { env } = context.cloudflare;
  const databaseSession = await db(env.DB)
    .insert(AuthSessions)
    .values({
      userId: userId,
    })
    .returning({ sessionUUID: AuthSessions.uuid });
  if (databaseSession === null || databaseSession.length !== 1)
    throw new Error("Could not create session");
  session.set("sessionUUID", databaseSession[0].sessionUUID);
  console.log("Inserted session", databaseSession[0].sessionUUID);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session, {
        maxAge: 60 * 60 * 24 * 7, // 7 days,
      }),
    },
  });
}

export async function getsessionUUID(
  request: Request
): Promise<string | undefined> {
  // Get the session ID from the request, which is not secured by anything - it's just what the user is presenting and should be considered untrusted
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  if (
    !session.has("sessionUUID") ||
    typeof session.data.sessionUUID !== "string" ||
    session.data.sessionUUID.length !== 32
  )
    return undefined;
  return session.data.sessionUUID;
}
export async function getAuthenticatedUser(
  request: Request,
  context: AppLoadContext
) {
  // This actually validates the session against the database
  // Somewhat duplicated below
  const sessionUUID = await getsessionUUID(request);
  if (sessionUUID === undefined) return null;
  const { env } = context.cloudflare;
  const databaseSession = await db(env.DB).query.AuthSessions.findFirst({
    with: {
      user: {
        where: ne(Users.permissionType, "DISABLED"),
      },
    },
    columns: {}, // Only select the user = ignore the rest
    where: and(
      eq(AuthSessions.uuid, sessionUUID),
      eq(AuthSessions.valid, true),
      between(
        AuthSessions.createdAt,
        sql`datetime('now', '-7 days')`,
        sql`datetime('now')`
      )
    ),
  });
  if (!databaseSession || databaseSession === null)
    throw await logout(request, context);
  const { user } = databaseSession as unknown as {
    user: InferSelectModel<typeof Users>;
  };
  return { user };
}

export async function requireAuthenticatedUserId(
  request: Request,
  context: AppLoadContext,
  redirectTo: string = new URL(request.url).pathname
) {
  // This is the same as the above, but it will protect the route or action it is part of and only returns the userid to speed things up
  const sessionUUID = await getsessionUUID(request);
  if (sessionUUID === undefined) return null;
  const { env } = context.cloudflare;
  const databaseSession = await db(env.DB).query.AuthSessions.findFirst({
    with: {
      user: {
        where: ne(Users.permissionType, "DISABLED"),
        columns: { id: true },
      },
    },
    columns: {}, // Only select the user = ignore the rest
    where: and(
      eq(AuthSessions.uuid, sessionUUID),
      eq(AuthSessions.valid, true),
      between(
        AuthSessions.createdAt,
        sql`datetime('now', '-7 days')`,
        sql`datetime('now')`
      )
    ),
  });
  if (!databaseSession || databaseSession === null)
    throw await logout(request, context);
  const { user } = databaseSession as unknown as { user: { id: number } };
  return user.id;
}

export async function logout(request: Request, context: AppLoadContext) {
  const cookie = request.headers.get("Cookie");
  const session = await getSession(cookie);
  if (
    session.has("sessionUUID") &&
    typeof session.data.sessionUUID === "string" &&
    session.data.sessionUUID.length === 32
  ) {
    const { env } = context.cloudflare;
    // TODO evaluate if there's a way of limiting this to one row? Otherwise it seems like you can end anyone's session by setting the cookie and doing this
    await db(env.DB)
      .update(AuthSessions)
      .set({ valid: false })
      .where(eq(AuthSessions.uuid, session.data.sessionUUID));
  }
  return redirect("/", {
    headers: {
      "Set-Cookie": await destroySession(session),
    },
  });
}
