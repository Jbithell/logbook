import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { Form, useSearchParams } from "@remix-run/react";
import { createUserSession, getSessionId } from "~/authsession.server";
export const meta: MetaFunction = () => {
  return [{ title: "Login" }];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionId = await getSessionId(request);
  if (sessionId) return redirect("/home");
  return json({});
}

function safeRedirect(
  to: FormDataEntryValue | string | null | undefined,
  defaultRedirect: string = "/home"
) {
  if (!to || typeof to !== "string") {
    return defaultRedirect;
  }

  if (!to.startsWith("/") || to.startsWith("//")) {
    return defaultRedirect;
  }

  return to;
}

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const redirectTo = safeRedirect(formData.get("redirectTo"));
  const email = formData.get("email");
  const password = formData.get("password");

  return createUserSession({
    request,
    userId: 12,
    redirectTo,
    context,
  });
}
export default function App() {
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/home";
  return (
    <Form method="post">
      <label htmlFor="email">Email address</label>
      <input
        id="email"
        required
        name="email"
        type="email"
        autoComplete="email"
      />

      <label htmlFor="password">Password</label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
      />
      <input type="hidden" name="redirectTo" value={redirectTo} />
      <button type="submit">Log in</button>
    </Form>
  );
}
