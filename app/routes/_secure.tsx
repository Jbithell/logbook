import { AppShell, LoadingOverlay, Title } from "@mantine/core";
import { json, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Outlet, useLoaderData, useNavigation } from "@remix-run/react";
import { SecureNavbar } from "~/components/SecureNavbar";
import { requireAuthenticatedUserId } from "~/utils/authsession.server";
import { useOptionalUser } from "~/utils/useUserHook";

export async function loader({ request, context }: LoaderFunctionArgs) {
  return json({
    user: await requireAuthenticatedUserId(request, context),
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  const user = useOptionalUser();
  const navigating = useNavigation();
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Title>Hello {user?.firstName}</Title>
        <SecureNavbar />
      </AppShell.Header>
      <AppShell.Main>
        <LoadingOverlay
          visible={navigating.state === "loading"}
          loaderProps={{ type: "oval", size: "xl" }}
        />
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
