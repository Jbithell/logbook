import { Text } from "@mantine/core";
import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { and, eq } from "drizzle-orm";
import { db } from "~/d1client.server";
import { Boats } from "~/db/schema/Boats";
import { requireAuthenticatedUserId } from "~/utils/authsession.server";
export const meta: MetaFunction = () => {
  return [{ title: "Boat" }];
};

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
      {data.boat.logEntries.map((logEntry) => (
        <Text>{logEntry.title}</Text>
      ))}
      <Link to={`/boats/${data.boat.uuid}/new`}>New Entry</Link>
    </>
  );
}
