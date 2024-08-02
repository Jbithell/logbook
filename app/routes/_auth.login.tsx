import { Text } from "@mantine/core";
import { MetaFunction } from "@remix-run/cloudflare";
export const meta: MetaFunction = () => {
  return [{ title: "Login" }];
};
export default function App() {
  return <Text>Login Page</Text>;
}
