import { drizzle } from "drizzle-orm/d1";
import { AuthSessions, AuthSessionsRelations } from "./db/schema/AuthSessions";
import { Boats, BoatsRelations } from "./db/schema/Boats";
import { LogEntries, LogEntriesRelations } from "./db/schema/LogEntries";
import { Trackers, TrackersRelations } from "./db/schema/Trackers";
import { UserPasswords } from "./db/schema/UserPasswords";
import { Users, UsersRelations } from "./db/schema/Users";
import { UsersToBoats, UsersToBoatsRelations } from "./db/schema/UsersToBoats";

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
      UsersToBoatsRelations,
      UserPasswords,
      Trackers,
      TrackersRelations,
    },
    logger: process.env.NODE_ENV === "production" ? false : true,
  });
