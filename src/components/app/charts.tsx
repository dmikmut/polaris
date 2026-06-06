"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  buildVolumeSeries,
  confidenceSeries,
  tokenSavingsSeries,
  violationBreakdown,
} from "@/lib/mock-data";

const tooltipStyle = {
  background: "rgba(10,12,18,0.92)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  fontSize: 12,
  color: "white",
  boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
  padding: "8px 10px",
};

export function BuildVolumeChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={buildVolumeSeries} margin={{ top: 12, left: 0, right: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="builds" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="errors" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="day" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
        <Area type="monotone" dataKey="builds" stroke="#60a5fa" strokeWidth={2} fill="url(#builds)" />
        <Area type="monotone" dataKey="errors" stroke="#f87171" strokeWidth={2} fill="url(#errors)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ConfidenceChart() {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={confidenceSeries} margin={{ top: 12, left: 0, right: 12, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="step" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} domain={[40, 100]} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: "rgba(255,255,255,0.1)" }} />
        <Line
          type="monotone"
          dataKey="confidence"
          stroke="#a855f7"
          strokeWidth={2.2}
          dot={{ r: 3, fill: "#a855f7", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#fff", stroke: "#a855f7", strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function ViolationBreakdownChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={violationBreakdown}
          cx="50%"
          cy="50%"
          innerRadius={48}
          outerRadius={78}
          paddingAngle={3}
          stroke="rgba(0,0,0,0.3)"
          dataKey="value"
        >
          {violationBreakdown.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} />
        <Legend
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.6)", paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TokenSavingsChart() {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <BarChart data={tokenSavingsSeries} margin={{ top: 12, left: 0, right: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="bar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.25} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="saved" fill="url(#bar)" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
