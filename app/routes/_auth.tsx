import { Container, Text } from "@mantine/core";
import { Outlet } from "@remix-run/react";

export default function App() {
  return (
    <Container mt={"lg"}>
      <Text>Auth Header</Text>
      <Outlet />
      <Text>Auth Footer</Text>
    </Container>
  );
}
