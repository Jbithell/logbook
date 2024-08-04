import { Container, Paper, Text, Title } from "@mantine/core";
import { Outlet } from "@remix-run/react";

export default function App() {
  return (
    <Container size={420} my={40}>
      <Title ta="center">Logbook</Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Your personal digital sailing logbook
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <Outlet />
      </Paper>
    </Container>
  );
}
