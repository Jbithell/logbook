import { Code, Table, Text, Title } from "@mantine/core";
import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { and, eq } from "drizzle-orm";
import { ClientOnly } from "remix-utils/client-only";
import { db } from "~/d1client.server";
import { Boats } from "~/db/schema/Boats";
import { requireAuthenticatedUserId } from "~/utils/authsession.server";
import { BatteryGraph } from "./BatteryGraph";
import { Map } from "./Map.client";

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const userId = await requireAuthenticatedUserId(request, context);
  if (
    typeof params.boat === "undefined" ||
    params.boat === null ||
    params.boat.length !== 21
  )
    throw redirect("/boats");
  const boat = await db(context.cloudflare.env.DB).query.Boats.findFirst({
    columns: {
      name: true,
      uuid: true,
      description: true,
    },
    with: {
      logEntries: true,
    },
    where: and(eq(Boats.ownerId, userId), eq(Boats.uuid, params.boat)), // TODO grab the boats for the user too
  });
  if (typeof params.boat === "undefined" || boat === null || !boat)
    throw redirect("/boats");
  return json({
    boat,
    userId,
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <>
      <Text>Specific Boat {data.boat.name}</Text>
      <Title>Battery Voltage Graph</Title>
      <BatteryGraph
        data={[
          {
            data: data.boat.logEntries.flatMap((logEntry) => {
              const observations = logEntry.observations as
                | {
                    trackerMeta: { batt: { value: number } };
                  }
                | {};
              if (
                Object.keys(observations).length !== 0 &&
                "trackerMeta" in observations &&
                "batt" in observations.trackerMeta &&
                typeof observations.trackerMeta.batt.value === "number" &&
                observations.trackerMeta.batt.value > 0
              )
                return [
                  {
                    time: new Date(logEntry.timestamp).getTime(),
                    batt: observations.trackerMeta.batt.value,
                  },
                ];
              else return [];
            }),
            name: "Battery",
            color: "blue.5",
          },
        ]}
      />
      <Title>Input ("Solar") Voltage Graph</Title>
      <BatteryGraph
        data={[
          {
            data: data.boat.logEntries.flatMap((logEntry) => {
              const observations = logEntry.observations as
                | {
                    trackerMeta: {
                      sol: { value: number };
                    };
                  }
                | {};
              if (
                Object.keys(observations).length !== 0 &&
                "trackerMeta" in observations &&
                "sol" in observations.trackerMeta &&
                typeof observations.trackerMeta.sol.value === "number" &&
                observations.trackerMeta.sol.value > 0
              )
                return [
                  {
                    time: new Date(logEntry.timestamp).getTime(),
                    batt: observations.trackerMeta.sol.value,
                  },
                ];
              else return [];
            }),
            name: "Input Voltage",
            color: "blue.5",
          },
        ]}
      />
      <Title>Signal Strength Graph</Title>
      <BatteryGraph
        data={[
          {
            data: data.boat.logEntries.flatMap((logEntry) => {
              const observations = logEntry.observations as
                | {
                    trackerMeta: { sig: { value: number } };
                  }
                | {};
              if (
                Object.keys(observations).length !== 0 &&
                "trackerMeta" in observations &&
                "sig" in observations.trackerMeta &&
                typeof observations.trackerMeta.sig.value === "number" &&
                observations.trackerMeta.sig.value !== 255
              )
                return [
                  {
                    time: new Date(logEntry.timestamp).getTime(),
                    batt: Math.round(
                      ((observations.trackerMeta.sig.value * -1 + 115) / 63) *
                        100
                    ),
                  },
                ];
              else return [];
            }),
            name: "Signal Strength",
            color: "blue.5",
          },
        ]}
      />
      <Title>Timing Variance Graph</Title>
      <BatteryGraph
        data={[
          {
            data: data.boat.logEntries.flatMap((logEntry) => {
              const observations = logEntry.observations as
                | {
                    trackerMeta: { variance: { value: number } };
                  }
                | {};
              if (
                Object.keys(observations).length !== 0 &&
                "trackerMeta" in observations &&
                "sig" in observations.trackerMeta &&
                "value" in observations.trackerMeta.variance &&
                typeof observations.trackerMeta.variance.value === "number" &&
                observations.trackerMeta.variance.value !== 255
              )
                return [
                  {
                    time: new Date(logEntry.timestamp).getTime(),
                    batt: observations.trackerMeta.variance.value,
                  },
                ];
              else return [];
            }),
            name: "Timing Variance",
            color: "blue.5",
          },
        ]}
      />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Title</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>Timestamp</Table.Th>
            <Table.Th>Created</Table.Th>
            <Table.Th>Updated</Table.Th>
            <Table.Th>Source</Table.Th>
            <Table.Th>Map</Table.Th>
            <Table.Th>Observations</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {data.boat.logEntries.map((logEntry) => (
            <Table.Tr key={logEntry.id}>
              <Table.Td>{logEntry.title}</Table.Td>
              <Table.Td>{logEntry.description}</Table.Td>
              <Table.Td>{new Date(logEntry.timestamp).toUTCString()}</Table.Td>
              <Table.Td>{new Date(logEntry.created).toUTCString()}</Table.Td>
              <Table.Td>{new Date(logEntry.updated).toUTCString()}</Table.Td>
              <Table.Td>{logEntry.source}</Table.Td>
              <Table.Td>
                <ClientOnly fallback={<Text>Map</Text>}>
                  {() =>
                    logEntry.latitude &&
                    logEntry.longitude &&
                    logEntry.latitude !== -91 &&
                    logEntry.longitude !== -181 && (
                      <Map
                        latitude={logEntry.latitude}
                        longitude={logEntry.longitude}
                        zoom={18}
                      />
                    )
                  }
                </ClientOnly>
              </Table.Td>
              <Table.Td>
                <Code block>
                  {JSON.stringify(logEntry.observations, null, "\t")}
                </Code>
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
      <Link to={`/boats/${data.boat.uuid}/new`}>New Entry</Link>
    </>
  );
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  if (!data) return [{ title: "Boat" }];
  return [{ title: data.boat.name }];
};
