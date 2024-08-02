import { Text } from "@mantine/core";
import { MetaFunction } from "@remix-run/cloudflare";
export const meta: MetaFunction = () => {
  return [{ title: "Register" }];
};
export default function App() {
  return <Text>Register Page</Text>;
}
