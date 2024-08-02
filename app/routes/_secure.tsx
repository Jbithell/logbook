import { AppShell, LoadingOverlay, Text } from "@mantine/core";
import { Outlet, useNavigation } from "@remix-run/react";
import { SecureNavbar } from "~/components/SecureNavbar";

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
