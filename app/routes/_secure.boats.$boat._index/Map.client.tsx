import { Button, ThemeIcon, Title } from "@mantine/core";
import { IconFlagBolt, IconSailboat } from "@tabler/icons-react";
import { divIcon, LatLng } from "leaflet";
import "leaflet/dist/leaflet.css";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
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
const ReCentreButton = (props: {
  lat: number;
  lon: number;
  zoom: number | undefined;
}) => {
  const map = useMap();
  return (
    <div className="leaflet-top leaflet-right">
      <div className="leaflet-control leaflet-bar">
        <Button
          onClick={() =>
            map.setView(new LatLng(props.lat, props.lon), props.zoom)
          }
        >
          <IconFlagBolt />
        </Button>
      </div>
    </div>
  );
};
export const Map = (props: {
  latitude: number;
  longitude: number;
  zoom: number;
}) => (
  <MapContainer
    center={[props.latitude, props.longitude]}
    zoom={props.zoom}
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
    <ReCentreButton
      lat={props.latitude}
      lon={props.longitude}
      zoom={props.zoom}
    />
  </MapContainer>
);
