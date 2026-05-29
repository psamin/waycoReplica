"use client";

interface Props {
  notes: string;
  loading: boolean;
  onChange: (value: string) => void;
  onAnalyze: () => void;
}

export default function IntakeForm({ notes, loading, onChange, onAnalyze }: Props) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
        Intake Notes
      </h2>
      <textarea
        className="w-full h-36 p-3 border border-gray-200 rounded-md text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Paste raw intake notes here..."
        value={notes}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        onClick={onAnalyze}
        disabled={loading || !notes.trim()}
        className="mt-3 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Analyzing..." : "Analyze Intake"}
      </button>
    </div>
  );
}
