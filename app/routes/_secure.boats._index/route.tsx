import { Button, Card, Text, TextInput } from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import { eq } from "drizzle-orm";
import { z as zod } from "zod";
import { zfd } from "zod-form-data";
import { db } from "~/d1client.server";
import { Boats } from "~/db/schema/Boats";
import { requireAuthenticatedUserId } from "~/utils/authsession.server";

export const meta: MetaFunction = () => {
  return [{ title: "Boat List" }];
};
export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireAuthenticatedUserId(request, context);
  return json({
    userId,
    boats: await db(context.cloudflare.env.DB).query.Boats.findMany({
      columns: {
        name: true,
        uuid: true,
        description: true,
      },
      where: eq(Boats.ownerId, userId), // TODO grab the boats for the user too - abstract this into a function because its also used by the trackers page to populate a list of boats
    }),
  });
}

const validator = zfd.formData({
  name: zfd.text(zod.string().min(1, { message: "Boat name is required" })),
  description: zfd.text(zod.string().optional()),
});

export async function action({ request, context }: ActionFunctionArgs) {
  const userId = await requireAuthenticatedUserId(request, context);
  const formData = await request.formData();
  const validated = validator.safeParse(formData);
  type formattedErrorsType = zod.inferFormattedError<typeof validator>;
  if (!validated.success)
    return json(
      { errors: validated.error.format() as formattedErrorsType },
      { status: 400 }
    );
  if (validated.data) {
    await db(context.cloudflare.env.DB).insert(Boats).values({
      ownerId: userId,
      name: validated.data.name,
      description: validated.data.description,
    });
    return json({ errors: {} as formattedErrorsType }, { status: 200 });
  }
}
export default function App() {
  const formData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  return (
    <>
      {loaderData?.boats.map((boat) => (
        <Card withBorder radius="md" p="md">
          <Card.Section mt="md">
            <Text fz="lg" fw={500}>
              {boat.name}
            </Text>
            <Text fz="sm" mt="xs">
              {boat.description}
            </Text>
          </Card.Section>
          <Link to={`/boats/${boat.uuid}`}>
            <Button radius="md" mt="xs" fullWidth>
              Show details
            </Button>
          </Link>
        </Card>
      ))}
      <Form method="post">
        <TextInput
          size="md"
          label="Name"
          autoFocus
          withAsterisk
          my="md"
          required
          error={formData?.errors?.name?._errors.join(", ")}
          name="name"
          type="text"
          placeholder="My Boat"
          disabled={navigation.state === "submitting"}
        />
        <TextInput
          size="md"
          my="md"
          label="Description"
          error={formData?.errors?.description?._errors.join(", ")}
          name="description"
          type="text"
          disabled={navigation.state === "submitting"}
        />
        <Button type="submit" fullWidth my="md" size="md">
          {navigation.state === "submitting" ? "Creating..." : "Create"}
        </Button>
      </Form>
    </>
  );
}
