"use client";

import { Metrics } from "@/types";

interface Props {
  metrics: Metrics;
}

export default function MetricsBar({ metrics }: Props) {
  const cards = [
    { label: "Completeness Score", value: `${metrics.completeness_score}%` },
    { label: "Missing Fields", value: metrics.missing_fields },
    { label: "Generated Tasks", value: metrics.generated_tasks },
    { label: "High Priority Tasks", value: metrics.high_priority_tasks },
    { label: "Providers Found", value: metrics.providers_found },
  ];

  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
