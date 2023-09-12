import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { Epochs } from "../neat/Epoch";
import { Column } from "../ui/Column";

export type ChartPageProps = {
  epochs: Epochs;
};

export const ChartPage = ({ epochs }: ChartPageProps) => {
  const data = epochs.epochs.map((p) => {
    return {
      name: p.generation,
      fitness: p.maxFitness,
    };
  });

  return (
    <Column width="100%" $shrink $grow>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 32, right: 32, bottom: 32, left: 32 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            domain={([dataMin, dataMax]) => {
              const range = dataMax - dataMin;
              const margin = range * 0.1;
              return [dataMin - margin, dataMax + margin];
            }}
            tickFormatter={(value) => value.toFixed(2)}
          />
          <Line type="monotone" dataKey="fitness" />
        </LineChart>
      </ResponsiveContainer>
    </Column>
  );
};
