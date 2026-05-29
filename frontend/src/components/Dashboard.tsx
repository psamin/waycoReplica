"use client";

import { useState } from "react";
import { CaseAnalysis, CaseSummary, FollowUpTask } from "@/types";
import MetricsBar from "./MetricsBar";
import IntakeForm from "./IntakeForm";
import CaseDashboard from "./CaseDashboard";

export default function Dashboard() {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<CaseAnalysis | null>(null);
  const [summary, setSummary] = useState<CaseSummary | null>(null);
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cases/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake_notes: notes }),
      });

      const json = await res.json();

      if (!res.ok || json.status !== "ok") {
        setError(json.detail ?? "Analysis failed.");
        return;
      }

      const data: CaseAnalysis = json.data;
      setAnalysis(data);
      setSummary({ ...data.case_summary });
      setTasks([...data.follow_up_tasks]);
    } catch {
      setError("Could not reach the server. Make sure Flask is running on port 5001.");
    } finally {
      setLoading(false);
    }
  }

  function handleSummaryChange(field: keyof CaseSummary, value: string) {
    if (!summary) return;
    setSummary({ ...summary, [field]: value });
  }

  function handleTaskToggle(index: number) {
    setTasks((prev) =>
      prev.map((t, i) =>
        i === index
          ? { ...t, status: t.status === "completed" ? "pending" : "completed" }
          : t
      )
    );
  }

  function handleSave() {
    // TODO: wire to POST /cases once DB layer is added
    alert("Case updates saved (backend not yet wired).");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-gray-200 px-8 py-4">
        <h1 className="text-lg font-semibold text-gray-900">Med-Legal Intake Dashboard</h1>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-6">
        {analysis && <MetricsBar metrics={analysis.metrics} />}

        <IntakeForm
          notes={notes}
          loading={loading}
          onChange={setNotes}
          onAnalyze={handleAnalyze}
        />

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {analysis && summary && (
          <CaseDashboard
            summary={summary}
            missingInfo={analysis.missing_information}
            tasks={tasks}
            onSummaryChange={handleSummaryChange}
            onTaskToggle={handleTaskToggle}
            onSave={handleSave}
          />
        )}
      </main>
    </div>
  );
}
