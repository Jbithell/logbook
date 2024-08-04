import { Alert, Button, PasswordInput, TextInput } from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import {
  Form,
  Link,
  useActionData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { db } from "~/d1client.server";
import { UserPasswords } from "~/db/schema/UserPasswords";
import { lower, Users } from "~/db/schema/Users";
import { createUserSession, getsessionUUID } from "~/utils/authsession.server";
import { passwordHash } from "~/utils/passwordHash";
export const meta: MetaFunction = () => {
  return [{ title: "Login" }];
};

export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionUUID = await getsessionUUID(request);
  if (sessionUUID) return redirect("/home");
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
  if (
    !email ||
    typeof email !== "string" ||
    !password ||
    typeof password !== "string"
  )
    return json({ error: "Blank email or password" }, { status: 400 });
  const { env } = context.cloudflare;

  const user = await db(env.DB)
    .select({
      id: Users.id,
      preSalt: UserPasswords.preSalt,
      postSalt: UserPasswords.postSalt,
      password: UserPasswords.hash,
    })
    .from(Users)
    .where(eq(lower(Users.email), email.toLowerCase()))
    .limit(1)
    .leftJoin(UserPasswords, eq(Users.id, UserPasswords.userId));
  if (
    user === null ||
    user.length !== 1 ||
    user[0].password === null ||
    user[0].preSalt === null ||
    user[0].postSalt === null
  )
    return json({ error: "Invalid email or password" }, { status: 400 });
  const passwordInput = await passwordHash(
    user[0].preSalt,
    user[0].postSalt,
    password
  );
  if (passwordInput !== user[0].password)
    return json({ error: "Invalid email or password" }, { status: 400 });
  return createUserSession({
    request,
    userId: user[0].id,
    redirectTo,
    context,
  });
}
export default function App() {
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();
  const data = useActionData<typeof action>();
  const redirectTo = searchParams.get("redirectTo") || "/home";
  return (
    <Form method="post">
      {data?.error && (
        <Alert variant="light" my="md" title={data.error}></Alert>
      )}
      <TextInput
        size="md"
        label="Email"
        my="md"
        autoFocus
        withAsterisk
        required
        autoComplete="email"
        name="email"
        type="email"
        placeholder="myboat@boat.com"
        disabled={navigation.state === "submitting"}
      />
      <PasswordInput
        size="md"
        my="md"
        label="Password"
        withAsterisk
        required
        autoComplete="current-password"
        name="password"
        disabled={navigation.state === "submitting"}
      />

      <input type="hidden" name="redirectTo" value={redirectTo} />
      <Button type="submit" fullWidth my="md" size="md">
        {navigation.state === "submitting" ? "Logging in..." : "Login"}
      </Button>
      <Link to="/register" style={{ textDecoration: "none" }}>
        <Button variant="subtle" fullWidth>
          Don't have an account yet? Register
        </Button>
      </Link>
    </Form>
  );
}
