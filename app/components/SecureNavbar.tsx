import { Container, Group, Box, Text, Image } from "@mantine/core";
import classes from "./Navbar.module.css";
import { Link, NavLink } from "@remix-run/react";

export function SecureNavbar() {
  return (
    <header className={classes.header}>
      <Container className={classes.inner}>
        <Link to={"/"}>home</Link>
        <Box className={classes.links} visibleFrom="sm">
          bUTTONS
        </Box>
      </Container>
    </header>
  );
}
