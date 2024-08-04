import { drizzle } from "drizzle-orm/d1";
import { AuthSessions, AuthSessionsRelations } from "./db/schema/AuthSessions";
import { Boats, BoatsRelations } from "./db/schema/Boats";
import { LogEntries, LogEntriesRelations } from "./db/schema/LogEntries";
import { Users, UsersRelations } from "./db/schema/Users";
import { UsersToBoats, usersToBoatsRelations } from "./db/schema/UsersToBoats";

export const db = (database: D1Database) =>
  drizzle(database, {
    schema: {
      Users,
      UsersRelations,
      AuthSessions,
      AuthSessionsRelations,
      Boats,
      BoatsRelations,
      LogEntries,
      LogEntriesRelations,
      UsersToBoats,
      usersToBoatsRelations,
    },
    logger: process.env.NODE_ENV === "production" ? false : true,
  });
