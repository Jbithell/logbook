import { relations, sql } from "drizzle-orm";
import {
  text,
  integer,
  sqliteTable,
  index,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { LogEntries } from "./LogEntries";
import { nanoid } from "nanoid";
import { Users } from "./Users";
import { UsersToBoats } from "./UsersToBoats";

// Used to track growth of an installation over time
export const Boats = sqliteTable(
  "boats",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").$defaultFn(() => nanoid()),
    name: text("name").notNull(),
    description: text("description"),
    ownerId: integer("owner", { mode: "number" })
      .notNull()
      .references(() => Users.id, { onUpdate: "cascade", onDelete: "cascade" }),
    publicLink: text("uuid").default(sql`NULL`),
  },
  (table) => {
    return {
      uuidIndex: uniqueIndex("uuid_idx").on(table.uuid),
      publicLinkIndex: uniqueIndex("public_link_idx").on(table.publicLink),
    };
  }
);

export const BoatsRelations = relations(Boats, ({ many, one }) => ({
  logEntries: many(LogEntries),
  owner: one(Users, {
    fields: [Boats.ownerId],
    references: [Users.id],
  }),
  users: many(UsersToBoats),
}));
