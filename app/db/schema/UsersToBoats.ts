import { relations } from "drizzle-orm";
import { integer, primaryKey, sqliteTable } from "drizzle-orm/sqlite-core";
import { Boats } from "./Boats";
import { Users } from "./Users";

export const UsersToBoats = sqliteTable(
  "users_to_boats",
  {
    userId: integer("user")
      .notNull()
      .references(() => Users.id),
    boatId: integer("boat")
      .notNull()
      .references(() => Boats.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.userId, t.boatId] }),
  })
);
export const UsersToBoatsRelations = relations(UsersToBoats, ({ one }) => ({
  boat: one(Boats, {
    fields: [UsersToBoats.boatId],
    references: [Boats.id],
  }),
  user: one(Users, {
    fields: [UsersToBoats.userId],
    references: [Users.id],
  }),
}));
