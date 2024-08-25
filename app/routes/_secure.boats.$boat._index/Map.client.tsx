import { Button, ThemeIcon, Title } from "@mantine/core";
import { IconFlagBolt, IconSailboat } from "@tabler/icons-react";
import { divIcon } from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import { MantineProviderWrapper } from "~/components/theme";

const fontAwesomeIcon = divIcon({
  html: renderToStaticMarkup(
    <MantineProviderWrapper>
      <ThemeIcon radius="md" size="lg">
        <IconSailboat />
      </ThemeIcon>
    </MantineProviderWrapper>
  ),
  iconSize: [20, 20],
  className: "myDivIcon",
});

export const Map = (props: { latitude: number; longitude: number }) => (
  <MapContainer
    center={[props.latitude, props.longitude]}
    zoom={18}
    scrollWheelZoom={false}
    style={{ height: "300px", width: "300px", zIndex: 0 }}
  >
    <TileLayer
      attribution='Map &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <Marker position={[props.latitude, props.longitude]} icon={fontAwesomeIcon}>
      <Popup>
        <Title>Location</Title>
      </Popup>
    </Marker>
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <Button>
          <IconFlagBolt />
        </Button>
      </div>
    </div>
  </MapContainer>
);
