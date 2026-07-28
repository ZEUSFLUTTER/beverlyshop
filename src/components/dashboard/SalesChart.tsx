'use client';

import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

interface SalesChartProps {
  data: any[];
  type?: 'bar' | 'line' | 'pie';
}

const COLORS = ['#b08d57', '#EA4335', '#FBBC05', '#34A853', '#C8A165'];

export function SalesChart({ data, type = 'bar' }: SalesChartProps) {
  if (!data || data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted">Aucune donnée disponible</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-100 rounded-lg p-3 shadow-lg">
          <p className="text-sm font-bold text-gray-500 mb-1">{label || payload[0].name}</p>
          <p className="text-lg font-bold" style={{ color: payload[0].payload.fill || 'var(--accent-primary)' }}>
            {type === 'pie' 
              ? payload[0].value 
              : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(payload[0].value).replace('XOF', 'FCFA')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        {type === 'pie' ? (
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              nameKey="name"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        ) : type === 'bar' ? (
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8f9fa' }} />
            <Bar dataKey="total" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="#A0A0A0" tick={{ fill: '#A0A0A0', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(value) => `${value / 1000}k`} />
            <Tooltip content={<CustomTooltip />} />
            <Line type="monotone" dataKey="total" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--accent-primary)', strokeWidth: 2 }} activeDot={{ r: 6 }} />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
