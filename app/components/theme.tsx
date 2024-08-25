import {
  createTheme,
  MantineColorsTuple,
  MantineProvider,
} from "@mantine/core";

/**
 * Doing this in a seperate file allwos us to use the theme in renderToStaticMarkup(
 */

const myColor: MantineColorsTuple = [
  "#ffe9f0",
  "#ffd0dd",
  "#faa0b8",
  "#f66d90",
  "#f2426f",
  "#f1275a",
  "#f1184f",
  "#d70841",
  "#c00038",
  "#a9002f",
];

const theme = createTheme({
  primaryColor: "pink",
  colors: {
    pink: myColor,
  },
  primaryShade: 3,
});

export const MantineProviderWrapper = (props: {
  children: React.ReactNode;
}) => <MantineProvider theme={theme}>{props.children}</MantineProvider>;
