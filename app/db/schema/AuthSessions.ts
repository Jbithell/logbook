import { relations, sql } from "drizzle-orm";
import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { Users } from "./Users";

export const AuthSessions = sqliteTable(
  "auth_sessions",
  {
    id: integer("id", { mode: "number" }).primaryKey({ autoIncrement: true }),
    uuid: text("uuid", { length: 32 }).$defaultFn(() => nanoid(32)),
    userId: integer("user", { mode: "number" })
      .notNull()
      .references(() => Users.id, { onUpdate: "cascade", onDelete: "cascade" }),
    createdAt: text("created_at").$defaultFn(() => sql`(unixepoch())`),
    valid: integer("valid", { mode: "boolean" }).$default(() => true),
  },
  (table) => {
    return {
      uuidIndex: uniqueIndex("auth_sessions_uuid_idx").on(table.uuid),
    };
  }
);

export const AuthSessionsRelations = relations(AuthSessions, ({ one }) => ({
  user: one(Users, {
    fields: [AuthSessions.userId],
    references: [Users.id],
  }),
}));
