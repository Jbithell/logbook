import {
  Burger,
  Container,
  Group,
  Menu,
  rem,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Form, Link, useLocation } from "@remix-run/react";
import { IconChevronDown, IconLogout } from "@tabler/icons-react";
import cx from "clsx";
import { useState } from "react";
import classes from "./Navbar.module.css";
const links = [
  { link: "/home", label: "Home" },
  { link: "/boats", label: "Boats" },
  { link: "/trackers", label: "Trackers" },
];

export function SecureNavbar({ name }: { name: string }) {
  const [opened, { toggle }] = useDisclosure(false);
  const [userMenuOpened, setUserMenuOpened] = useState(false);
  const location = useLocation();
  const items = links.map((link) => (
    <Link
      key={link.label}
      to={link.link}
      className={classes.link}
      data-active={location.pathname === link.link || undefined}
    >
      {link.label}
    </Link>
  ));
  return (
    <header className={classes.header}>
      <Container className={classes.mainSection} size="md">
        <Group justify="space-between">
          <Group gap={5} visibleFrom="xs">
            {items}
          </Group>
          <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />

          <Menu
            width={260}
            position="bottom-end"
            transitionProps={{ transition: "pop-top-right" }}
            onClose={() => setUserMenuOpened(false)}
            onOpen={() => setUserMenuOpened(true)}
            withinPortal
          >
            <Menu.Target>
              <UnstyledButton
                className={cx(classes.user, {
                  [classes.userActive]: userMenuOpened,
                })}
              >
                <Group gap={7}>
                  <Text fw={500} size="sm" lh={1} mr={3}>
                    James
                  </Text>
                  <IconChevronDown
                    style={{ width: rem(12), height: rem(12) }}
                    stroke={1.5}
                  />
                </Group>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Form action="/logout" method="post">
                <Menu.Item
                  type="submit"
                  leftSection={
                    <IconLogout
                      style={{ width: rem(16), height: rem(16) }}
                      stroke={1.5}
                    />
                  }
                >
                  Logout
                </Menu.Item>
              </Form>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Container>
    </header>
  );
}
