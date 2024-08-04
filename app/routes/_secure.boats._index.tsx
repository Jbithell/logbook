import { Text } from "@mantine/core";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
import { requireAuthenticatedUser } from "~/authsession.server";
export const meta: MetaFunction = () => {
  return [{ title: "Boat List" }];
};
export async function loader({ request, context }: LoaderFunctionArgs) {
  return json({
    user: await requireAuthenticatedUser(request, context),
  });
}

export default function App() {
  return <Text>List of Boats</Text>;
}
