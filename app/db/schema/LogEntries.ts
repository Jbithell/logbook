import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { Boats } from "./Boats";
import { Users } from "./Users";

export const LogEntries = sqliteTable(
  "log_entries",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    boatId: integer("boat", { mode: "number" })
      .notNull()
      .references(() => Boats.id, { onUpdate: "cascade", onDelete: "cascade" }),
    timestamp: integer("timestamp", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    created: integer("created", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updated: integer("updated", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => sql`(unixepoch())`),
    source: text("source").notNull(),
    userId: integer("user", { mode: "number" })
      .references(() => Users.id, {
        onUpdate: "set null",
        onDelete: "set null",
      })
      .default(sql`NULL`),
    latitude: real("lat").default(-91.0), // Latitude must be between -90 and 90, so we can use this as a null
    longitude: real("long").default(-181.0), // Longitude must be between -180 and 180, so we can use this as a null
    title: text("title").default(sql`NULL`),
    description: text("description").default(sql`NULL`),
    observations: text("", { mode: "json" }).default({}),
  },
  (table) => {
    return {
      userIndex: index("log_entries_user_idx").on(table.userId),
      boatIndex: index("log_entries_boat_idx").on(table.boatId),
      timestampIndex: index("log_entries_timestamp_idx").on(table.timestamp),
      latitudeIndex: index("log_entries_lat_idx").on(table.latitude),
      longitudeIndex: index("log_entries_long_idx").on(table.longitude),
    };
  }
);

export const LogEntriesRelations = relations(LogEntries, ({ one }) => ({
  boat: one(Boats, {
    fields: [LogEntries.boatId],
    references: [Boats.id],
  }),
  user: one(Users, {
    fields: [LogEntries.userId],
    references: [Users.id],
  }),
}));
