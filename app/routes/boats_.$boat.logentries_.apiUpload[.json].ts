import {
  ActionFunctionArgs,
  AppLoadContext,
  json,
  redirect,
} from "@remix-run/cloudflare";
import { Params } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { z as zod } from "zod";
import { Boats } from "~/db/schema/Boats";
import { LogEntries } from "~/db/schema/LogEntries";
import { db } from "../d1client.server";

export const loader = async () => redirect("/");

const validator = zod.object({
  lat: zod.number().min(-90).max(90).optional(), // Latitude
  lon: zod.number().min(-180).max(180).optional(), // Longitude
  sogkts: zod.number().optional(), // Speed over ground in knots
  alt: zod.number().optional(), // Altitude in meters
  sig: zod.number(), // Signal quality in dBm
  batt: zod.number(), // Battery level in volts
  sol: zod.number(), // Solar panel input voltage in volts
  id: zod.number(), // ESP32 MAC address
  utc: zod
    .object({
      year: zod.string(),
      month: zod.string(),
      day: zod.string(),
      hour: zod.string(),
      minute: zod.string(),
      second: zod.string(),
    })
    .optional(),
});

const getBoatFromParam = async (
  params: Params<string>,
  context: AppLoadContext
) => {
  if (
    typeof params.boat === "undefined" ||
    params.boat === null ||
    params.boat.length !== 21
  )
    throw json({ message: "No boat found" }, 404);
  const boat = await db(context.cloudflare.env.DB).query.Boats.findFirst({
    columns: {
      name: true,
      id: true,
    },
    where: eq(Boats.uuid, params.boat),
  });
  return boat;
};

export const action = async ({
  context,
  request,
  params,
}: ActionFunctionArgs) => {
  const boat = await getBoatFromParam(params, context);
  if (typeof params.boat === "undefined" || boat === null || !boat)
    return json({ message: "Unknown boat" }, 404);

  if (request.method !== "PUT")
    return json({ message: "Method not allowed" }, 405);

  let payload: unknown;
  try {
    payload = await request.json();
  } catch (e) {
    return json({ message: "Invalid JSON" }, 400);
  }
  const validated = await validator.safeParse(payload);
  if (!validated.success)
    return json(
      {
        ...validated.error,
      },
      400
    );

  const date = new Date();
  if (validated.data.utc) {
    date.setUTCFullYear(Number(validated.data.utc.year));
    date.setUTCMonth(Number(validated.data.utc.month));
    date.setUTCDate(Number(validated.data.utc.day));
    date.setUTCHours(Number(validated.data.utc.hour));
    date.setUTCMinutes(Number(validated.data.utc.minute));
    date.setUTCSeconds(Number(validated.data.utc.second));
  }
  const insertLogEntry = await db(context.cloudflare.env.DB)
    .insert(LogEntries)
    .values({
      boatId: boat.id,
      timestamp: date,
      source: "API - " + validated.data.id,
      latitude: validated.data.lat || null,
      longitude: validated.data.lon || null,
      observations: {
        speedOverGroundKts: {
          value: validated.data.sogkts,
          unit: "kts",
          title: "Speed over ground",
        },
        altitudeMeters: {
          value: validated.data.alt,
          unit: "m",
          title: "Altitude",
        },
        sig: {
          value: validated.data.sig,
          unit: "dBm",
          title: "Mobile signal quality",
        },
        batt: {
          value: validated.data.batt,
          unit: "V",
          title: "Battery level",
        },
        sol: {
          value: validated.data.sol,
          unit: "V",
          title: "Input voltage",
        },
      },
    });
  if (insertLogEntry.error) return json({ message: insertLogEntry.error }, 500);
  return json({}, 200);
};
