"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  notes: string;
  loading: boolean;
  onChange: (value: string) => void;
  onAnalyze: () => void;
}

export default function IntakeForm({ notes, loading, onChange, onAnalyze }: Props) {
  const [recording, setRecording] = useState(false);
  const [supported, setSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const committedRef = useRef(""); // finalized transcript so far

  useEffect(() => {
    const SR = window.SpeechRecognition ?? (window as Window & { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) {
      setSupported(false);
      return;
    }

    const rec = new SR();
    rec.continuous = true;       // keeps capturing through pauses
    rec.interimResults = true;   // show partial words as they're spoken
    rec.lang = "en-US";

    rec.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      let newFinal = committedRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          newFinal += (newFinal ? " " : "") + transcript.trim();
          committedRef.current = newFinal;
        } else {
          interim = transcript;
        }
      }

      onChange(interim ? `${newFinal} ${interim}` : newFinal);
    };

    rec.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "aborted") return;
      // audio-capture = mic dropped briefly (macOS glitch) — restart silently
      if (event.error === "audio-capture") {
        setTimeout(() => {
          try { rec.start(); } catch { /* already running */ }
        }, 300);
        return;
      }
      console.error("Speech recognition error:", event.error);
      setRecording(false);
    };

    rec.onend = () => {
      // restart automatically while recording is still active
      if (recognitionRef.current && recording) {
        try { rec.start(); } catch { /* already started */ }
      }
    };

    recognitionRef.current = rec;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleRecording() {
    const rec = recognitionRef.current;
    if (!rec) return;

    if (recording) {
      setRecording(false);
      rec.stop();
    } else {
      committedRef.current = notes; // keep any existing text as the base
      setRecording(true);
      rec.start();
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
          Intake Notes
        </h2>
        {recording && (
          <span className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Recording — speak in any order
          </span>
        )}
      </div>

      <textarea
        className="w-full h-36 p-3 border border-gray-200 rounded-md text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Paste notes or use the mic to speak them..."
        value={notes}
        onChange={(e) => onChange(e.target.value)}
      />

      <div className="mt-3 flex items-center gap-3">
        {supported && (
          <button
            onClick={toggleRecording}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-40 ${
              recording
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
            }`}
          >
            <span className="text-base">{recording ? "⏹" : "🎤"}</span>
            {recording ? "Stop" : "Record"}
          </button>
        )}

        <button
          onClick={onAnalyze}
          disabled={loading || !notes.trim()}
          className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Analyzing..." : "Analyze Intake"}
        </button>

        {!supported && (
          <span className="text-xs text-gray-400">
            Mic not supported in this browser — use Chrome
          </span>
        )}
      </div>
    </div>
  );
}
