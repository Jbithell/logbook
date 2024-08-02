import { Text } from "@mantine/core";
import { MetaFunction } from "@remix-run/cloudflare";
import { useLoaderData } from "@remix-run/react";
export const meta: MetaFunction = () => {
  return [{ title: "Boat List" }];
};
export default function App() {
  return <Text>List of Boats</Text>;
}
