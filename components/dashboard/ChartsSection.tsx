'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';

interface Props {
  statusData: { name: string; value: number; color: string }[];
  priorityData: { name: string; value: number; color: string }[];
  platformData: { name: string; value: number; color: string }[];
  trendData: { date: string; count: number }[];
}

const tooltipStyle = {
  contentStyle: {
    background: '#1e2130',
    border: '1px solid #2d3142',
    borderRadius: '8px',
    color: '#e2e8f0',
    fontSize: '12px',
  },
  labelStyle: { color: '#94a3b8' },
  cursor: { fill: 'rgba(14,165,233,0.05)' },
};

function CustomLegend({ data }: { data: { name: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col gap-2 justify-center">
      {data.map(d => (
        <div key={d.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
          <span className="text-xs text-slate-400 flex-1">{d.name}</span>
          <span className="text-xs font-semibold text-slate-200">{d.value}</span>
          <span className="text-[10px] text-slate-500 w-8 text-right">
            {total > 0 ? Math.round((d.value / total) * 100) : 0}%
          </span>
        </div>
      ))}
    </div>
  );
}

export default function ChartsSection({ statusData, priorityData, platformData, trendData }: Props) {
  const isEmpty = statusData.length === 0 && trendData.every(d => d.count === 0);

  if (isEmpty) {
    return (
      <div className="card p-12 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-slate-400">Charts will appear once tickets are created.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Weekly Trend — full width */}
      <div className="card p-5 md:col-span-2">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Weekly Issue Trend</h3>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={trendData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <defs>
              <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3142" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#0ea5e9"
              strokeWidth={2}
              fill="url(#trendGrad)"
              dot={{ fill: '#0ea5e9', r: 3 }}
              name="Issues"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Status Breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Status Breakdown</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={statusData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2d3142" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip {...tooltipStyle} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Count">
              {statusData.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Priority Breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Priority Breakdown</h3>
        {priorityData.length > 0 ? (
          <div className="flex items-center gap-4 h-[200px]">
            <ResponsiveContainer width="60%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1">
              <CustomLegend data={priorityData} />
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-slate-500 text-sm">No data</div>
        )}
      </div>

      {/* 4. Platform Breakdown */}
      <div className="card p-5 md:col-span-2">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Platform Breakdown</h3>
        {platformData.length > 0 ? (
          <div className="flex items-center gap-8">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={140}>
                <BarChart
                  data={platformData}
                  layout="vertical"
                  margin={{ top: 0, right: 16, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#2d3142" horizontal={false} />
                  <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} width={60} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} name="Tickets" barSize={20}>
                    {platformData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="w-48 flex-shrink-0">
              <CustomLegend data={platformData} />
            </div>
          </div>
        ) : (
          <div className="h-[140px] flex items-center justify-center text-slate-500 text-sm">No data</div>
        )}
      </div>
    </div>
  );
}
