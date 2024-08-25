import { Table, Text } from "@mantine/core";
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
                <pre>{JSON.stringify(logEntry.observations, null, "\t")}</pre>
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
