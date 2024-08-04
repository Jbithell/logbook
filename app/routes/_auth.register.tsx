import { Text } from "@mantine/core";
import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { getSessionId } from "~/authsession.server";
export const meta: MetaFunction = () => {
  return [{ title: "Register" }];
};
export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  if (sessionId) return redirect("/home");
  return json({});
}

export default function App() {
  return <Text>Register Page</Text>;
}
