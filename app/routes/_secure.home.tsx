import { Text } from "@mantine/core";
import { json, LoaderFunctionArgs, MetaFunction } from "@remix-run/cloudflare";
import { requireAuthenticatedUserId } from "~/utils/authsession.server";
export const meta: MetaFunction = () => {
  return [{ title: "Home" }];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  return json({
    user: await requireAuthenticatedUserId(request, context),
  });
}

export default function App() {
  return <Text>Homepage</Text>;
}
