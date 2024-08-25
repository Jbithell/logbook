import { Button, Text, TextInput } from "@mantine/core";
import {
  AppLoadContext,
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import type { ActionFunctionArgs } from "@remix-run/node";
import { Params, useActionData, useLoaderData } from "@remix-run/react";
import { useForm, validationError } from "@rvf/remix";
import { withZod } from "@rvf/zod";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/d1client.server";
import { Boats } from "~/db/schema/Boats";
import { LogEntries } from "~/db/schema/LogEntries";
import { requireAuthenticatedUserId } from "~/utils/authsession.server";

export const meta: MetaFunction = () => {
  return [{ title: "Boat" }];
};

const getBoatFromParam = async (
  params: Params<string>,
  context: AppLoadContext,
  userId: number
) => {
  if (
    typeof params.boat === "undefined" ||
    params.boat === null ||
    params.boat.length !== 21
  )
    throw redirect("/boats");
  const boat = await db(context.cloudflare.env.DB).query.Boats.findFirst({
    columns: {
      name: true,
      id: true,
    },
    where: and(eq(Boats.ownerId, userId), eq(Boats.uuid, params.boat)), // TODO abstract this into a function & grab the boats for the user too
  });
  return boat;
};

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const userId = await requireAuthenticatedUserId(request, context);
  const boat = await getBoatFromParam(params, context, userId);
  console.log(boat);
  if (typeof params.boat === "undefined" || boat === null || !boat)
    throw redirect("/boats");
  return json({
    boat,
    userId,
  });
}

const validator = withZod(
  z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    latitude: z.number().gte(-90).lte(90).optional(),
    longitude: z.number().gte(-180).lte(180).optional(),
  })
);

export const action = async ({
  params,
  request,
  context,
}: ActionFunctionArgs) => {
  const userId = await requireAuthenticatedUserId(request, context);
  const boat = await getBoatFromParam(params, context, userId);
  if (typeof params.boat === "undefined" || boat === null || !boat)
    throw redirect("/boats");
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error, result.submittedData);
  await db(context.cloudflare.env.DB).insert(LogEntries).values({
    boatId: boat.id,
    title: result.data.title,
    description: result.data.description,
    latitude: result.data.latitude,
    longitude: result.data.longitude,
    source: "Web",
  });
  return null;
};

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const errorData = useActionData<typeof action>();
  const form = useForm({
    method: "post",
    validator,
  });

  return (
    <form {...form.getFormProps()}>
      {form.renderFormIdInput()}
      <Text>New entry for {loaderData.boat.name}</Text>

      <TextInput {...form.getControlProps("title")} label="Title" />

      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
