import { Box, Container } from "@mantine/core";
import { Form, Link } from "@remix-run/react";
import classes from "./Navbar.module.css";

export function SecureNavbar() {
  return (
    <header className={classes.header}>
      <Container className={classes.inner}>
        <Link to={"/home"}>home</Link>
        <Box className={classes.links} visibleFrom="sm">
          bUTTONS
        </Box>
        <Form action="/logout" method="post">
          <button type="submit">Logout</button>
        </Form>
      </Container>
    </header>
  );
}
