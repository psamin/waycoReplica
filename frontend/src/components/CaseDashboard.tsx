"use client";

import { CaseSummary, FollowUpTask } from "@/types";

const PRIORITY_STYLES: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-green-100 text-green-700",
};

interface Props {
  summary: CaseSummary;
  missingInfo: string[];
  tasks: FollowUpTask[];
  onSummaryChange: (field: keyof CaseSummary, value: string) => void;
  onTaskToggle: (index: number) => void;
  onSave: () => void;
}

export default function CaseDashboard({
  summary,
  missingInfo,
  tasks,
  onSummaryChange,
  onTaskToggle,
  onSave,
}: Props) {
  const summaryFields: { label: string; field: keyof CaseSummary }[] = [
    { label: "Client Name", field: "client_name" },
    { label: "Incident Date", field: "incident_date" },
    { label: "Incident Type", field: "incident_type" },
    { label: "Injuries", field: "injuries" },
    { label: "Providers", field: "providers" },
    { label: "Treatment Status", field: "treatment_status" },
    { label: "Insurance Info", field: "insurance_info" },
    { label: "Case Status", field: "case_status" },
  ];

  function displayValue(value: CaseSummary[keyof CaseSummary]): string {
    if (value === null || value === undefined) return "";
    if (Array.isArray(value)) return value.join(", ");
    return String(value);
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Case Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Case Summary
          </h2>
          <button
            onClick={onSave}
            className="px-4 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-700 transition-colors"
          >
            Save Updates
          </button>
        </div>
        <div className="space-y-3">
          {summaryFields.map(({ label, field }) => (
            <div key={field} className="flex items-center gap-3">
              <span className="w-36 text-xs text-gray-500 shrink-0">{label}</span>
              <input
                type="text"
                value={displayValue(summary[field])}
                onChange={(e) => onSummaryChange(field, e.target.value)}
                placeholder="Missing"
                className="flex-1 px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800 placeholder-red-300"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-6">
        {/* Missing Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Missing Information
          </h2>
          {missingInfo.length === 0 ? (
            <p className="text-sm text-green-600">No missing fields.</p>
          ) : (
            <ul className="space-y-1">
              {missingInfo.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Follow-Up Tasks */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
            Follow-Up Tasks
          </h2>
          {tasks.length === 0 ? (
            <p className="text-sm text-gray-400">No tasks generated.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task, i) => (
                <li key={i} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={task.status === "completed"}
                    onChange={() => onTaskToggle(i)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 cursor-pointer"
                  />
                  <span
                    className={`flex-1 text-sm ${
                      task.status === "completed"
                        ? "line-through text-gray-400"
                        : "text-gray-700"
                    }`}
                  >
                    {task.task}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                      PRIORITY_STYLES[task.priority] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {task.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
