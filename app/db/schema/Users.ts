import { relations, SQL, sql } from "drizzle-orm";
import {
  text,
  integer,
  sqliteTable,
  uniqueIndex,
  AnySQLiteColumn,
} from "drizzle-orm/sqlite-core";
import { Boats } from "./Boats";
import { nanoid } from "nanoid";
import { UsersToBoats } from "./UsersToBoats";

// Used to track growth of an installation over time
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
      emailIndex: uniqueIndex("email_idx").on(lower(table.email)), //Make sure the table is unique on the lowercase email
    };
  }
);
export function lower(email: AnySQLiteColumn): SQL {
  return sql`lower(${email})`;
}

export const BoatsRelations = relations(Users, ({ many }) => ({
  boatsOwned: many(Boats),
  boats: many(UsersToBoats),
}));
