import { relations, SQL, sql } from "drizzle-orm";
import {
  AnySQLiteColumn,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { AuthSessions } from "./AuthSessions";
import { Boats } from "./Boats";
import { LogEntries } from "./LogEntries";
import { UsersToBoats } from "./UsersToBoats";

export const Users = sqliteTable(
  "users",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").$defaultFn(() => nanoid()),
    firstName: text("first_name").notNull(),
    surname: text("surname").notNull(),
    email: text("email").notNull(),
    permissionType: text("permission_type", {
      enum: ["DISABLED", "VIEW-ONLY", "VIEW-AND-CREATE", "ADMIN"],
    }).default("VIEW-ONLY"),
  },
  (table) => {
    return {
      emailIndex: uniqueIndex("users_email_idx").on(lower(table.email)), //Make sure the table is unique on the lowercase email
    };
  }
);
export function lower(email: AnySQLiteColumn): SQL {
  return sql`lower(${email})`;
}

export const UsersRelations = relations(Users, ({ many }) => ({
  boatsOwned: many(Boats),
  boats: many(UsersToBoats),
  logEntries: many(LogEntries),
  authSessions: many(AuthSessions),
}));
