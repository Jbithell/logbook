import { Button, Card, Select, Text, Textarea, TextInput } from "@mantine/core";
import {
  ActionFunctionArgs,
  json,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/cloudflare";
import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { useForm, validationError } from "@rvf/remix";
import { withZod } from "@rvf/zod";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/d1client.server";
import { Boats } from "~/db/schema/Boats";
import { Trackers } from "~/db/schema/Trackers";
import { requireAuthenticatedUserId } from "~/utils/authsession.server";

export const meta: MetaFunction = () => {
  return [{ title: "Tracking Devices List" }];
};
export async function loader({ request, context }: LoaderFunctionArgs) {
  const userId = await requireAuthenticatedUserId(request, context);
  return json({
    userId,
    trackers: await db(context.cloudflare.env.DB).query.Trackers.findMany({
      columns: {
        name: true,
        id: true,
        uuid: true,
        description: true,
      },
      with: {
        boat: {
          columns: {
            name: true,
          },
        },
      },
      where: eq(Trackers.ownerId, userId), // TODO grab the boats for the user too
    }),
    boats: await db(context.cloudflare.env.DB).query.Boats.findMany({
      columns: {
        name: true,
        id: true,
      },
      where: eq(Boats.ownerId, userId), // TODO grab the boats for the user too - abstract this into a function because its also used by the trackers page to populate a list of boats
    }),
  });
}

const validator = withZod(
  z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    boat: z.string(),
  })
);

export async function action({ request, context }: ActionFunctionArgs) {
  const userId = await requireAuthenticatedUserId(request, context);
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error, result.submittedData);
  await db(context.cloudflare.env.DB)
    .insert(Trackers)
    .values({
      name: result.data.title,
      description: result.data.description,
      ownerId: userId,
      currentBoat: Number(result.data.boat),
    });
  return null;
}
export default function App() {
  const formData = useActionData<typeof action>();
  const loaderData = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const form = useForm({
    method: "post",
    validator,
  });
  return (
    <>
      {loaderData?.trackers.map((tracker) => (
        <Card withBorder radius="md" p="md">
          <Card.Section mt="md">
            <Text fz="lg" fw={500}>
              {tracker.name} - Boat: {tracker.boat.name}
            </Text>
            <Text fz="md">{tracker.uuid}</Text>
            <Text fz="sm" mt="xs">
              {tracker.description}
            </Text>
          </Card.Section>
        </Card>
      ))}
      <form {...form.getFormProps()}>
        {form.renderFormIdInput()}
        <Text>New Tracker</Text>

        <TextInput {...form.getInputProps("title")} label="Title" />

        <Textarea {...form.getInputProps("description")} label="Description" />

        <Select
          {...form.getControlProps("boat")}
          label="Boat"
          data={loaderData.boats.map((boat) => ({
            value: String(boat.id),
            label: boat.name,
          }))}
        />

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          fullWidth
          mt={"md"}
        >
          {form.formState.isSubmitting ? "Creating..." : "Create"}
        </Button>
      </form>
    </>
  );
}
