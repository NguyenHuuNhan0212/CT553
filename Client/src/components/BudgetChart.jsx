import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function BudgetChart({ costEstimate }) {
  if (!costEstimate) return null;
  const data = [
    { name: 'Hotel', value: costEstimate.hotel || 0 },
    { name: 'Food', value: costEstimate.food || 0 },
    { name: 'Transport', value: costEstimate.transport || 0 },
    { name: 'Tickets', value: costEstimate.tickets || 0 }
  ];
  return (
    <PieChart width={400} height={300}>
      <Pie
        data={data}
        dataKey='value'
        nameKey='name'
        cx='50%'
        cy='50%'
        outerRadius={80}
        label
      >
        {data.map((entry, index) => (
          <Cell key={`c-${index}`} fill={COLORS[index % COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  );
}
