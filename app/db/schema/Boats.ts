import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { LogEntries } from "./LogEntries";
import { Users } from "./Users";
import { UsersToBoats } from "./UsersToBoats";

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
      uuidIndex: uniqueIndex("boats_uuid_idx").on(table.uuid),
      publicLinkIndex: uniqueIndex("boats_public_link_idx").on(
        table.publicLink
      ),
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
