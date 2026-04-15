"use client";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { normalizeStats } from "@/lib/compare";
import type { ComparableRow } from "@/lib/types";

interface Props {
  rows: ComparableRow[];
  statLabels: Record<string, string>;
}

const COLORS = ["#d4a44a", "#c8372d", "#6bcb77", "#4d96ff"];

export function ComparatorRadar({ rows, statLabels }: Props) {
  if (rows.length === 0) return null;
  const normalized = normalizeStats(rows);
  const statKeys = Object.keys(statLabels);
  const data = statKeys.map((k) => {
    const point: Record<string, string | number> = { stat: statLabels[k] };
    normalized.forEach((r) => {
      point[r.name] = typeof r.stats[k] === "number" ? (r.stats[k] as number) : 0;
    });
    return point;
  });
  return (
    <div className="w-full h-[260px] sm:h-[300px] md:h-[340px]">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid stroke="#3a3a3a" />
          <PolarAngleAxis dataKey="stat" stroke="#a0a0a0" fontSize={11} />
          <PolarRadiusAxis stroke="#3a3a3a" fontSize={10} />
          {rows.map((r, i) => (
            <Radar
              key={r.id}
              name={r.name}
              dataKey={r.name}
              stroke={COLORS[i % COLORS.length]}
              fill={COLORS[i % COLORS.length]}
              fillOpacity={0.2}
            />
          ))}
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
