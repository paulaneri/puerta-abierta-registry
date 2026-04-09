import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatCurrency } from "@/lib/utils";

interface PieData {
  name: string;
  value: number;
}

export const GastosPieChart = ({ data }: { data: PieData[] }) => (
  <ResponsiveContainer width="100%" height={280}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        labelLine={false}
        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
        outerRadius={100}
        dataKey="value"
      >
        {data.map((_entry, index) => (
          <Cell key={`cell-${index}`} fill={`hsl(${(index * 67 + 200) % 360}, 65%, 50%)`} />
        ))}
      </Pie>
      <Tooltip formatter={(value: number) => [`$${formatCurrency(value)}`, 'Monto']} />
    </PieChart>
  </ResponsiveContainer>
);
