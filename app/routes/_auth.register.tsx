import { Alert, Button, TextInput } from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import { Form, Link, useActionData, useNavigation } from "@remix-run/react";
import { nanoid } from "nanoid";
import { z as zod } from "zod";
import { zfd } from "zod-form-data";
import { PasswordInputField } from "~/components/PasswordInput";
import { db } from "~/d1client.server";
import { UserPasswords } from "~/db/schema/UserPasswords";
import { Users } from "~/db/schema/Users";
import { createUserSession, getsessionUUID } from "~/utils/authsession.server";
import { passwordHash } from "~/utils/passwordHash";
export const meta: MetaFunction = () => {
  return [{ title: "Register" }];
};
export async function loader({ request, context }: LoaderFunctionArgs) {
  const sessionUUID = await getsessionUUID(request);
  if (sessionUUID) return redirect("/home");
  return json({});
}

const validator = zfd.formData({
  firstName: zfd.text(
    zod.string().min(1, { message: "First name is required" })
  ),
  surname: zfd.text(zod.string().min(1, { message: "Last name is required" })),
  email: zfd.text(
    zod
      .string()
      .min(1, { message: "Email is required" })
      .email("Must be a valid email")
  ),
  password: zfd.text(
    zod.string().min(6, { message: "Password must be at least 6 characters" })
  ),
});

export async function action({ request, context }: ActionFunctionArgs) {
  const formData = await request.formData();
  const validated = validator.safeParse(formData);
  type formattedErrorsType = zod.inferFormattedError<typeof validator>;
  if (!validated.success)
    return json(
      { error: "", errors: validated.error.format() as formattedErrorsType },
      { status: 400 }
    );
  if (validated.data) {
    const { env } = context.cloudflare;
    let userId: number;
    try {
      // This should be wrapped in a transaction, but it isn't supported by D1 at the moment
      let user = await db(env.DB)
        .insert(Users)
        .values({
          firstName: validated.data.firstName,
          surname: validated.data.surname,
          email: validated.data.email,
        })
        .returning({ userId: Users.id });
      if (user === null || user.length !== 1)
        throw new Error("Error creating user account");
      let preSalt = nanoid(16);
      let postSalt = nanoid(16);
      let hash = await passwordHash(preSalt, postSalt, validated.data.password);
      await db(env.DB).insert(UserPasswords).values({
        userId: user[0].userId,
        preSalt: preSalt,
        postSalt: postSalt,
        hash: hash,
      });
      userId = user[0].userId;
    } catch (e) {
      console.error(e);
      return json(
        {
          error: "Error creating user account - email already exists",
          errors: {} as formattedErrorsType,
        },
        { status: 400 }
      );
    }
    return createUserSession({
      request,
      userId: userId,
      redirectTo: "/home",
      context,
    });
  }
}
export default function App() {
  const data = useActionData<typeof action>();
  const navigation = useNavigation();
  return (
    <Form method="post">
      {data?.error && (
        <Alert variant="light" my="md" title="Error">
          {data.error}
        </Alert>
      )}
      <TextInput
        size="md"
        label="Email"
        autoFocus
        withAsterisk
        my="md"
        required
        error={data?.errors?.email?._errors.join(", ")}
        autoComplete="email"
        name="email"
        type="email"
        placeholder="myboat@boat.com"
        disabled={navigation.state === "submitting"}
      />
      <TextInput
        size="md"
        my="md"
        label="First Name"
        withAsterisk
        required
        error={data?.errors?.firstName?._errors.join(", ")}
        autoComplete="given-name"
        name="firstName"
        type="text"
        placeholder="John"
        disabled={navigation.state === "submitting"}
      />
      <TextInput
        size="md"
        my="md"
        label="Surname"
        withAsterisk
        required
        error={data?.errors?.surname?._errors.join(", ")}
        autoComplete="family-name"
        name="surname"
        type="text"
        placeholder="Boater"
        disabled={navigation.state === "submitting"}
      />
      <PasswordInputField
        size="md"
        my="md"
        label="Password"
        withAsterisk
        required
        error={data?.errors?.password?._errors.join(", ")}
        autoComplete="new-password"
        name="password"
        disabled={navigation.state === "submitting"}
      />
      <Button type="submit" fullWidth my="md" size="md">
        {navigation.state === "submitting" ? "Creating account..." : "Register"}
      </Button>
      <Link to="/login" style={{ textDecoration: "none" }}>
        <Button variant="subtle" fullWidth>
          Already have an account? Login
        </Button>
      </Link>
    </Form>
  );
}
