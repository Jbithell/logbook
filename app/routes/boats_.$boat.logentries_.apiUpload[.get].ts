import {
  AppLoadContext,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Params } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { z as zod } from "zod";
import { Boats } from "~/db/schema/Boats";
import { LogEntries } from "~/db/schema/LogEntries";
import { db } from "../d1client.server";

const validator = zod.object({
  lat: zod.number().min(-91).max(90), // Latitude - accept -91 as a null
  lon: zod.number().min(-181).max(180), // Longitude - accept -181 as a null
  sog: zod.number(), // Speed over ground in knots
  alt: zod.number(), // Altitude in meters
  sig: zod.number(), // Signal quality in dBm, 
  bat: zod.number(), // Battery level in volts
  vlt: zod.number(), // Solar panel input voltage in volts
  id: zod.number(), // ESP32 MAC address
  y: zod.number(),
  j: zod.number(),
  d: zod.number(),
  h: zod.number(),
  m: zod.number(),
  s: zod.number(),
  slp: zod.number(), // How many seconds the device is intending to sleep for after this (0 if it won't sleep, and instead will delay (below)). Use this to work out when you're next expecting a check-in
  dly: zod.number(), // How many seconds the device will delay before sending the next message - this will keep it awake. Use this to work out when you're next expecting a check-in
  rty: zod.number(), // How many times the device has retried sending this message
  ver: zod.string(), // Firmware version
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

export const loader = async ({
  context,
  request,
  params,
}: LoaderFunctionArgs) => {
  /**
   * NB THIS IS DONE AS A LOADER!
   * IN ORDER TO SUPPORT THE USE OF THE SEARCH PARAMS
   * BECAUSE THAT'S ALL THE ARDUNIO CAN COPE WITH
   */
  const boat = await getBoatFromParam(params, context);
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  if (typeof params.boat === "undefined" || boat === null || !boat)
    return json({ message: "Unknown boat" }, 404);

  if (request.method !== "GET")
    return json({ message: "Method not allowed" }, 405);

  console.log(searchParams);
  const validated = await validator.safeParse({
    lat: Number(searchParams.get("lat")),
    lon: Number(searchParams.get("lon")),
    sog: Number(searchParams.get("sog")),
    alt: Number(searchParams.get("alt")),
    sig: Number(searchParams.get("sig")),
    bat: Number(searchParams.get("bat")),
    vlt: Number(searchParams.get("vlt")),
    id: Number(searchParams.get("id")),
    y: Number(searchParams.get("y")),
    j: Number(searchParams.get("j")),
    d: Number(searchParams.get("d")),
    h: Number(searchParams.get("h")),
    m: Number(searchParams.get("m")),
    s: Number(searchParams.get("s")),
    slp: Number(searchParams.get("slp")),
    dly: Number(searchParams.get("dly")),
    rty: Number(searchParams.get("rty")),
    ver: searchParams.get("ver"),
  });
  if (!validated.success)
    return json(
      {
        ...validated.error,
      },
      400
    );

  const date = new Date();
  if (validated.data.y !== 0) {
    date.setUTCFullYear(Number(validated.data.y));
    date.setUTCMonth(Number(validated.data.j) - 1);
    date.setUTCDate(Number(validated.data.d));
    date.setUTCHours(Number(validated.data.h));
    date.setUTCMinutes(Number(validated.data.m));
    date.setUTCSeconds(Number(validated.data.s));
  }
  const insertLogEntry = await db(context.cloudflare.env.DB)
    .insert(LogEntries)
    .values({
      boatId: boat.id,
      timestamp: date,
      source: "API - " + validated.data.id,
      latitude: validated.data.lat >= -90 ? validated.data.lat : null,
      longitude: validated.data.lon >= -181 ? validated.data.lon : null,
      observations: {
        ...(validated.data.lat >= -90 && {
          speedOverGroundKts: {
            value: validated.data.sog,
            unit: "kts",
            title: "Speed over ground",
          },
          altitudeMeters: {
            value: validated.data.alt,
            unit: "m",
            title: "Altitude",
          },
        }),
        sig: {
          value: validated.data.sig,
          unit: "dBm",
          title: "Mobile signal quality",
        },
        batt: {
          value: validated.data.bat,
          unit: "V",
          title: "Battery level",
        },
        sol: {
          value: validated.data.vlt,
          unit: "V",
          title: "Input voltage",
        },
        delay: {
          seconds: validated.data.dly,
          title: "Delay",
          unit: "seconds",
        },
        sleep: {
          seconds: validated.data.slp,
          title: "Sleep",
          unit: "seconds",
        },
        retry: {
          count: validated.data.rty,
          title: "Retry",
          unit: "times",
        },
        version: {
          value: validated.data.ver,
          title: "Firmware version",
          unit: "",
        },
      },
    });
  if (insertLogEntry.error) return json({ message: insertLogEntry.error }, 500);
  return json({}, 200);
};
