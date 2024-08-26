import { ScatterChart, ScatterChartSeries } from "@mantine/charts";
export const BatteryGraph = (props: { data: ScatterChartSeries[] }) => {
  const lowest = props.data[0].data.reduce((prev, curr) =>
    prev.time < curr.time ? prev : curr
  );
  const highest = props.data[0].data.reduce((prev, curr) =>
    prev.time > curr.time ? prev : curr
  );
  return (
    <ScatterChart
      h={350}
      data={props.data}
      xAxisProps={{
        domain: [lowest.time, highest.time],
      }}
      dataKey={{ x: "time", y: "batt" }}
      xAxisLabel="Time"
      yAxisLabel="Battery"
    />
  );
};
