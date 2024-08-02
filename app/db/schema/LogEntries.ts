import { relations, sql } from "drizzle-orm";
import { text, integer, sqliteTable, index } from "drizzle-orm/sqlite-core";
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
      .default(sql`CURRENT_TIMESTAMP`),
    userId: integer("user", { mode: "number" })
      .references(() => Users.id, {
        onUpdate: "set null",
        onDelete: "set null",
      })
      .default(sql`NULL`),
  },
  (table) => {
    return {
      userIndex: index("user_idx").on(table.userId),
    };
  }
);

export const LogRelations = relations(LogEntries, ({ one }) => ({
  boat: one(Boats, {
    fields: [LogEntries.boatId],
    references: [Boats.id],
  }),
}));
