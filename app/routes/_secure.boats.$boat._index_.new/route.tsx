import { Button, Input, Text } from "@mantine/core";
import {
  json,
  LoaderFunctionArgs,
  MetaFunction,
  redirect,
} from "@remix-run/cloudflare";
import type { ActionFunctionArgs } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import {
  isValidationErrorResponse,
  useForm,
  validationError,
} from "@rvf/remix";
import { withZod } from "@rvf/zod";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "~/d1client.server";
import { Boats } from "~/db/schema/Boats";
import { requireAuthenticatedUserId } from "~/utils/authsession.server";

export const meta: MetaFunction = () => {
  return [{ title: "Boat" }];
};

export async function loader({ params, request, context }: LoaderFunctionArgs) {
  const userId = await requireAuthenticatedUserId(request, context);
  if (
    typeof params.boat === "undefined" ||
    params.boat === null ||
    params.boat.length !== 21
  )
    throw redirect("/boats");
  const boat = await db(context.cloudflare.env.DB).query.Boats.findFirst({
    columns: {
      name: true,
    },
    where: and(eq(Boats.ownerId, userId), eq(Boats.uuid, params.boat)), // TODO abstract this into a function & grab the boats for the user too
  });
  if (typeof params.boat === "undefined" || boat === null || !boat)
    throw redirect("/boats");
  return json({
    boat,
    userId,
  });
}

const validator = withZod(
  z.object({
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
    email: z
      .string()
      .min(1, { message: "Email is required" })
      .email("Must be a valid email"),
  })
);

export const action = async ({ request }: ActionFunctionArgs) => {
  const result = await validator.validate(await request.formData());
  if (result.error) return validationError(result.error, result.submittedData);
  return {
    message: `Submitted for ${result.data.firstName} ${result.data.lastName}!`,
  };
};

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const errorData = useActionData<typeof action>();
  const form = useForm({
    method: "post",
    validator,
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  return (
    <form {...form.getFormProps()}>
      <Text>New entry for {loaderData.boat.name}</Text>

      <Input
        {...form.getControlProps("firstName")}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          form.getControlProps("firstName").onChange(event.target.value)
        }
      />
      <Input
        {...form.getControlProps("lastName")}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          form.getControlProps("lastName").onChange(event.target.value)
        }
      />
      <Input
        {...form.getControlProps("email")}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
          form.getControlProps("email").onChange(event.target.value)
        }
      />

      {errorData && !isValidationErrorResponse(errorData) && (
        <Text>{errorData.message}</Text>
      )}
      <Button type="submit" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Creating..." : "Create"}
      </Button>
    </form>
  );
}
