import {
  Button,
  Card,
  Container,
  Group,
  Image,
  List,
  SimpleGrid,
  Text,
  Title,
} from "@mantine/core";
import type { MetaFunction } from "@remix-run/cloudflare";
import { Link } from "@remix-run/react";
import { IconArrowRight } from "@tabler/icons-react";
export const meta: MetaFunction = () => {
  return [{ title: "Logbook | Boat Logbook" }];
};

export default function Index() {
  return (
    <Container mt={"lg"}>
      <Title order={1} mb={"md"}>
        Logbook
      </Title>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
    </Container>
  );
}
