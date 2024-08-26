import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { Boats } from "./Boats";
import { LogEntries } from "./LogEntries";
import { Users } from "./Users";

export const Trackers = sqliteTable(
  "trackers",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid").$defaultFn(() => nanoid()), // Also doubles as the key the device uses to identify itself
    name: text("name").notNull(),
    description: text("description"),
    ownerId: integer("owner", { mode: "number" })
      .notNull()
      .references(() => Users.id, { onUpdate: "cascade", onDelete: "cascade" }),
    created: integer("created", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => sql`(unixepoch())`), // Doing this as a defaultfn means we're always using the server time, not mixing and matching server & database
    lastHeardFrom: integer("lastHeard", { mode: "timestamp" }).default(
      sql`NULL`
    ),
    expectedNextCheckIn: integer("expectedNextCheckIn", {
      mode: "timestamp",
    }).default(sql`NULL`),
    currentBoat: integer("currentBoat", { mode: "number" })
      .references(() => Boats.id, {
        onUpdate: "cascade",
        onDelete: "cascade",
      })
      .notNull(),
  },
  (table) => {
    return {
      uuidIndex: uniqueIndex("tracker_uuid_idx").on(table.uuid),
    };
  }
);

export const TrackersRelations = relations(Trackers, ({ many, one }) => ({
  logEntries: many(LogEntries),
  boat: one(Boats, {
    fields: [Trackers.currentBoat],
    references: [Boats.id],
  }),
  owner: one(Users, {
    fields: [Trackers.ownerId],
    references: [Users.id],
  }),
}));
