import { Text } from "@mantine/core";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
export const meta: MetaFunction = () => {
  return [{ title: "Boat" }];
};

export async function loader({ params }: LoaderFunctionArgs) {
  return json({ boat: params.boat });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return <Text>Specific Boat {data.boat}</Text>;
}
