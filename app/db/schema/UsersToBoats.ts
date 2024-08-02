import { integer, sqliteTable, primaryKey } from "drizzle-orm/sqlite-core";
import { Users } from "./Users";
import { Boats } from "./Boats";
import { relations } from "drizzle-orm";

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
export const usersToBoatsRelations = relations(UsersToBoats, ({ one }) => ({
  boat: one(Boats, {
    fields: [UsersToBoats.boatId],
    references: [Boats.id],
  }),
  user: one(Users, {
    fields: [UsersToBoats.userId],
    references: [Users.id],
  }),
}));
