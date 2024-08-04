import { AppShell, LoadingOverlay, Text } from "@mantine/core";
import { json, LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Outlet, useNavigation } from "@remix-run/react";
import { SecureNavbar } from "~/components/SecureNavbar";
import { requireAuthenticatedUser } from "~/authsession.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  return json({
    user: await requireAuthenticatedUser(request, context),
  });
}

export default function App() {
  const navigating = useNavigation();
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
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
