import { useMatches } from "@remix-run/react";
import { InferSelectModel } from "drizzle-orm";
import { useMemo } from "react";
import { Users } from "~/db/schema/Users";

function useMatchesData(id: string): Record<string, unknown> | undefined {
  const matchingRoutes = useMatches();
  const route = useMemo(
    () => matchingRoutes.find((route) => route.id === id),
    [matchingRoutes, id]
  );
  return route ? (route.data as Record<string, unknown>) : undefined;
}

function isUser(user: any): user is InferSelectModel<typeof Users> {
  return user && typeof user === "object" && typeof user.email === "string";
}
// This can only be used in the main function of each page
export function useOptionalUser(): InferSelectModel<typeof Users> | undefined {
  const data = useMatchesData("root");
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
}
