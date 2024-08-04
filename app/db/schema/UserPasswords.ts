import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";
import { Users } from "./Users";

// Store the passwords seperately to the user, so it isn't downloaded each time the user is fetched
export const UserPasswords = sqliteTable("user_passwords", {
  userId: integer("userId", { mode: "number" })
    .primaryKey()
    .references(() => Users.id, { onUpdate: "cascade", onDelete: "cascade" }),
  preSalt: text("pre_salt", { length: 16 })
    .notNull()
    .$defaultFn(() => nanoid(16)),
  postSalt: text("post_salt", { length: 16 })
    .notNull()
    .$defaultFn(() => nanoid(16)),
  hash: text("hash").notNull(),
});
