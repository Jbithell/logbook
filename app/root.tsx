import "@mantine/charts/styles.css";
import "@mantine/code-highlight/styles.css";
import {
  Button,
  ColorSchemeScript,
  Container,
  Group,
  Text,
  Title,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/nprogress/styles.css";
import { LoaderFunctionArgs, json } from "@remix-run/cloudflare";
import {
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useRouteError,
} from "@remix-run/react";
import classes from "./components/ErrorBoundary.module.css";
import { MantineProviderWrapper } from "./components/theme";
import { getAuthenticatedUser } from "./utils/authsession.server";

export async function loader({ request, context }: LoaderFunctionArgs) {
  return json({
    ...(await getAuthenticatedUser(request, context)),
  });
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProviderWrapper>{children}</MantineProviderWrapper>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary() {
  const error = useRouteError();
  console.log(error); // Send error to CF workers dashboard
  if (isRouteErrorResponse(error)) {
    return (
      <Container className={classes.root}>
        <div className={classes.label}>{error.status}</div>
        <Title className={classes.title}>{error.statusText}</Title>
        <Text c="dimmed" size="lg" ta="center" className={classes.description}>
          {error.data}
        </Text>
        <Group justify="center">
          <Link to="/">
            <Button variant="subtle" size="md">
              Take me back to home page
            </Button>
          </Link>
        </Group>
      </Container>
    );
  } else if (error instanceof Error) {
    return (
      <Container className={classes.root}>
        <Title className={classes.title}>{error.name}</Title>
        <Text c="dimmed" size="lg" ta="center" className={classes.description}>
          {process.env.NODE_ENV !== "production"
            ? error.message
            : "An error occurred trying to load this page, please try again later."}
        </Text>
        <Group justify="center">
          <Link to="/">
            <Button variant="subtle" size="md">
              Take me back to home page
            </Button>
          </Link>
        </Group>
      </Container>
    );
  } else {
    return <h1>Unknown Error</h1>;
  }
}
