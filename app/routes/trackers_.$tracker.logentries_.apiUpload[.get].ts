import {
  AppLoadContext,
  json,
  LoaderFunctionArgs,
} from "@remix-run/cloudflare";
import { Params } from "@remix-run/react";
import { eq } from "drizzle-orm";
import { z as zod } from "zod";
import { LogEntries } from "~/db/schema/LogEntries";
import { Trackers } from "~/db/schema/Trackers";
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

const getTrackerAndBoatFromParam = async (
  params: Params<string>,
  context: AppLoadContext
) => {
  if (
    typeof params.tracker === "undefined" ||
    params.tracker === null ||
    params.tracker.length !== 21
  )
    throw json({ message: "No tracker specified" }, 404);
  const tracker = await db(context.cloudflare.env.DB).query.Trackers.findFirst({
    columns: {
      id: true,
      expectedNextCheckIn: true,
    },
    with: {
      boat: {
        columns: {
          id: true,
        },
      },
    },
    where: eq(Trackers.uuid, params.tracker),
  });
  if (!tracker?.boat.id || !tracker?.id)
    throw json({ message: "Unknown Boat or Tracker" }, 404);
  return {
    boatId: tracker.boat.id,
    trackerId: tracker.id,
    trackerNextCheckIn: tracker.expectedNextCheckIn,
  };
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
  const tracker = await getTrackerAndBoatFromParam(params, context);
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  if (typeof params.tracker === "undefined" || tracker === null || !tracker)
    return json({ message: "Unknown Boat or Tracker" }, 404);

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

  // Calculate the expected next check-in time, and set it in the database
  const expectedNextCheckIn = new Date(
    new Date().getTime() +
      (validated.data.dly !== 0 ? validated.data.dly : validated.data.slp) *
        1000
  );
  const updateTracker = await db(context.cloudflare.env.DB)
    .update(Trackers)
    .set({
      expectedNextCheckIn,
    })
    .where(eq(Trackers.id, tracker.trackerId));
  if (updateTracker.error) return json({ message: updateTracker.error }, 500);
  const insertLogEntry = await db(context.cloudflare.env.DB)
    .insert(LogEntries)
    .values({
      boatId: tracker.boatId,
      trackerId: tracker.trackerId,
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
        trackerMeta: {
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
            title:
              "Time to wait for before next check-in, whilst staying online",
            unit: "seconds",
          },
          sleep: {
            seconds: validated.data.slp,
            title: "Time to shutdown for before next check-in",
            unit: "seconds",
          },
          retry: {
            count: validated.data.rty,
            title: "Number of retries it took to send this message",
            unit: "times",
          },
          version: {
            value: validated.data.ver,
            title: "Firmware version",
            unit: "",
          },
          ...(tracker.trackerNextCheckIn && {
            variance: {
              seconds: Math.round(
                (new Date().getTime() - tracker.trackerNextCheckIn.getTime()) /
                  1000
              ),
              title:
                "Difference in seconds between the expected time this message would be recieved, and when it was actually recieved",
              unit: "seconds",
            },
          }),
        },
      },
    });
  if (insertLogEntry.error) return json({ message: insertLogEntry.error }, 500);
  return json({}, 200);
};
