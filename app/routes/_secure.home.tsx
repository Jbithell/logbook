import { Text } from "@mantine/core";
import { MetaFunction } from "@remix-run/cloudflare";
export const meta: MetaFunction = () => {
  return [{ title: "Home" }];
};
export default function App() {
  return <Text>Homepage</Text>;
}
