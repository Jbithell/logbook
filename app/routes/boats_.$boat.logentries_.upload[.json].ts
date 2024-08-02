import {
  ActionFunctionArgs,
  json,
  redirect,
  type LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { db } from "../d1client.server";
import { withZod } from "@remix-validated-form/with-zod";
import { number, z as zod } from "zod";
import { GenericObject, validationError } from "remix-validated-form";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { LogEntries } from "~/db/schema/LogEntries";
import { Boats } from "~/db/schema/Boats";

export const loader = async () => redirect("/privacy-and-security");

const validator = withZod(
  zod.object({
    boatuuid: zod.string().min(21).max(21), // This value comes from the URL parameter
  })
);

export const action = async ({
  context,
  request,
  params,
}: ActionFunctionArgs) => {
  const { env, cf } = context.cloudflare;
  if (request.method !== "PUT") {
    return json({ message: "Method not allowed" }, 405);
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ message: "Invalid JSON" }, 400);
  }
  const unvalidatedData = {
    ...(payload as GenericObject),
    boatuuid: params.boat,
  };
  const validated = await validator.validate(unvalidatedData);
  if (validated.error) return validationError(validated.error);

  const findBoat = await db(env.DB)
    .select({ id: Boats.id })
    .from(Boats)
    .where(eq(Boats.uuid, validated.boatuuid))
    .limit(1);
  if (findBoat.length !== 1) return json({ message: "Boat not Found" }, 404);
  const boatId = findBoat[0].id;

  const insertLogEntry = await db(env.DB).insert(LogEntries).values({
    boatId: boatId,
    timestamp: new Date(),
  });
  if (insertLogEntry.error) return json({ message: insertLogEntry.error }, 500);
  return json({}, 200);
};
