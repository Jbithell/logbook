import { ScatterChart, ScatterChartSeries } from "@mantine/charts";
export const BatteryGraph = (props: { data: ScatterChartSeries[] }) => {
  const lowestX = props.data[0].data.reduce((prev, curr) =>
    prev.time < curr.time ? prev : curr
  );
  const highestX = props.data[0].data.reduce((prev, curr) =>
    prev.time > curr.time ? prev : curr
  );
  const lowestY = props.data[0].data.reduce((prev, curr) =>
    prev.batt < curr.batt ? prev : curr
  );
  const highestY = props.data[0].data.reduce((prev, curr) =>
    prev.batt > curr.batt ? prev : curr
  );
  return (
    <ScatterChart
      h={350}
      data={props.data}
      xAxisProps={{
        domain: [lowestX.time, highestX.time],
      }}
      yAxisProps={{
        domain: [lowestY.batt, highestY.batt],
      }}
      dataKey={{ x: "time", y: "batt" }}
      xAxisLabel="Time"
      yAxisLabel="Battery"
    />
  );
};
