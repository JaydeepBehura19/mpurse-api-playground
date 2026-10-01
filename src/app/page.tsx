"use client";

import React, { useState, useEffect } from "react";
import { usePaymentPlayground } from "@/hooks/usePaymentPlayground";
import { ToastContainer } from "@/components/Toast";
import Editor from "@monaco-editor/react";
import {
  Key,
  Eye,
  EyeOff,
  Play,
  Copy,
  Check,
  ExternalLink,
  FileCode,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Trash2,
  Circle,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  History,
  Sun,
  Moon
} from "lucide-react";

export default function Home() {
  const {
    clientId,
    setClientId,
    clientSecret,
    setClientSecret,
    encryptionKey,
    setEncryptionKey,
    passKey,
    setPassKey,
    mid,
    setMid,
    sessionUrl,
    setSessionUrl,
    jsonBody,
    setJsonBody,
    isRunning,
    response,
    error,
    paymentUrl,
    steps,
    history,
    toasts,
    executePlaygroundFlow,
    cancelPlaygroundFlow,
    resetPlayground,
    showToast
  } = usePaymentPlayground();

  // Secrets visibility states
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [showEncKey, setShowEncKey] = useState<boolean>(false);
  const [showPassKey, setShowPassKey] = useState<boolean>(false);

  // JSON Validation & stats
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  const [showHeaders, setShowHeaders] = useState<boolean>(false);

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("mpurse_theme");
      if (saved === "dark" || saved === "light") {
        setTheme(saved);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", theme === "dark");
      localStorage.setItem("mpurse_theme", theme);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Replay / history panel state
  const [showHistoryPanel, setShowHistoryPanel] = useState<boolean>(false);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [historyTab, setHistoryTab] = useState<"request" | "response">("request");
  const [copiedHistory, setCopiedHistory] = useState<boolean>(false);

  const selectedHistoryEntry = history.find((h) => h.id === selectedHistoryId) || null;

  const handleOpenHistoryEntry = (id: string) => {
    setSelectedHistoryId(id);
    setHistoryTab("request");
  };

  const handleCloseHistoryPanel = () => {
    setShowHistoryPanel(false);
    setSelectedHistoryId(null);
  };

  const handleCopyHistoryContent = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedHistory(true);
    showToast("Copied to clipboard", "success");
    setTimeout(() => setCopiedHistory(false), 2000);
  };

  // Collapse the headers section again whenever a new error comes in
  useEffect(() => {
    setShowHeaders(false);
  }, [error]);

  useEffect(() => {
    if (!jsonBody.trim()) {
      setJsonError("JSON body cannot be empty");
      return;
    }
    try {
      JSON.parse(jsonBody);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON syntax");
    }
  }, [jsonBody]);

  // Format request body
  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonBody);
      setJsonBody(JSON.stringify(parsed, null, 2));
      showToast("JSON payload formatted", "success");
    } catch (e: any) {
      showToast("Formatting failed: invalid JSON syntax", "error");
    }
  };

  // Copy final response/error to clipboard
  const handleCopyResponse = () => {
    const dataToCopy = response || error;
    if (!dataToCopy) {
      showToast("No response output to copy", "error");
      return;
    }
    navigator.clipboard.writeText(
      typeof dataToCopy === "string" ? dataToCopy : JSON.stringify(dataToCopy, null, 2)
    );
    setCopiedResponse(true);
    showToast("Response copied to clipboard", "success");
    setTimeout(() => setCopiedResponse(false), 2000);
  };

  return (
    <div className="h-screen bg-[#faf9ff] text-[#1e1b4b] dark:bg-zinc-950 dark:text-zinc-100 flex flex-col antialiased overflow-hidden">

      {/* Main Grid Canvas */}
      <main className="flex-1 min-h-0 p-4 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-y-auto lg:overflow-hidden">

        {/* LEFT COLUMN: Section 1 (Credentials) & Section 3 (Hit API) merged into one card */}
        <div className="lg:col-span-5 flex flex-col gap-3 lg:min-h-0">

          {/* SECTION 1: API Credentials */}
          <div className="bg-white border border-[#eeebfc] rounded-xl p-4 shadow-xs flex flex-col gap-3 shrink-0 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center gap-2 border-b border-zinc-50 pb-2 shrink-0 dark:border-zinc-800">
              <Key className="h-4 w-4 text-[#7c3aed]" />
              <h2 className="text-xs font-bold text-zinc-800 tracking-wide uppercase dark:text-zinc-100">
                1. API Credentials
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              {/* Client ID */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                  Client ID
                </label>
                <input
                  type="text"
                  placeholder="Enter merchant client id..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-white border border-[#eeebfc] rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>

              {/* Client Secret */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                  Client Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    placeholder="Enter client secret..."
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="w-full bg-white border border-[#eeebfc] rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Encryption Key */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                  Encryption Key
                </label>
                <div className="relative">
                  <input
                    type={showEncKey ? "text" : "password"}
                    placeholder="Enter payload encryption key..."
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    className="w-full bg-white border border-[#eeebfc] rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEncKey(!showEncKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showEncKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Pass Key */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                  Pass Key
                </label>
                <div className="relative">
                  <input
                    type={showPassKey ? "text" : "password"}
                    placeholder="Enter gateway authorization pass key..."
                    value={passKey}
                    onChange={(e) => setPassKey(e.target.value)}
                    className="w-full bg-white border border-[#eeebfc] rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassKey(!showPassKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-300"
                  >
                    {showPassKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* MID */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                  MID
                </label>
                <input
                  type="text"
                  placeholder="Enter merchant id..."
                  value={mid}
                  onChange={(e) => setMid(e.target.value)}
                  className="w-full bg-white border border-[#eeebfc] rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-500"
                />
              </div>
            </div>

            {/* SECTION 3: Hit API Section (merged into the same card) */}
            <div className="flex items-center gap-2 border-b border-t border-zinc-50 pb-2 pt-3 shrink-0 dark:border-zinc-800">
              <Play className="h-4 w-4 text-[#7c3aed] fill-[#7c3aed]/10" />
              <h2 className="text-xs font-bold text-zinc-800 tracking-wide uppercase dark:text-zinc-100">
                3. Hit API Section
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide dark:text-zinc-500">
                  Payment Session API URL
                </label>
                <textarea
                  placeholder="Enter session URL..."
                  value={sessionUrl}
                  onChange={(e) => setSessionUrl(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-[#eeebfc] rounded-lg px-3 py-2 text-[11px] font-mono text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all resize-none break-all dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200"
                />
              </div>

              <button
                onClick={isRunning ? cancelPlaygroundFlow : executePlaygroundFlow}
                className="w-full py-2 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-white" />
                    <span>Generate Session</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Section 2 (Request Body) & Section 4 (Response Body) */}
        <div className="lg:col-span-7 flex flex-col gap-2 lg:min-h-0">

          {/* SECTION 2: Request Body JSON */}
          <div className="bg-white border border-[#eeebfc] rounded-xl p-4 shadow-xs flex flex-col gap-2.5 min-h-[260px] lg:flex-[1.15] lg:min-h-0 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-2 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-[#7c3aed]" />
                <h2 className="text-xs font-bold text-zinc-800 tracking-wide uppercase dark:text-zinc-100">
                  2. Request Body JSON
                </h2>
              </div>

              {/* Status & formatting button */}
              <div className="flex items-center gap-3">
                <button
                  onClick={toggleTheme}
                  className="flex items-center justify-center p-1.5 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-md text-zinc-600 transition-colors duration-150 cursor-pointer dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:text-zinc-300"
                  title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                >
                  {theme === "light" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                </button>

                <button
                  onClick={resetPlayground}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-md text-[11px] font-semibold text-zinc-600 transition-colors duration-150 cursor-pointer dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:text-zinc-300"
                  title="Clear all local configurations"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Reset
                </button>

                <div className="relative">
                  <button
                    onClick={() => {
                      setShowHistoryPanel((prev) => !prev);
                      setSelectedHistoryId(null);
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-md text-[11px] font-semibold text-zinc-600 transition-colors duration-150 cursor-pointer dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:bg-zinc-800 dark:text-zinc-300"
                    title="View last 5 runs"
                  >
                    <History className="h-3.5 w-3.5" />
                    Replay
                  </button>

                  {showHistoryPanel && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-[#eeebfc] rounded-xl shadow-lg z-50 overflow-hidden dark:bg-zinc-900 dark:border-zinc-700">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-50 dark:border-zinc-800">
                        <div className="flex items-center gap-1.5">
                          {selectedHistoryEntry && (
                            <button
                              onClick={() => setSelectedHistoryId(null)}
                              className="text-zinc-400 hover:text-zinc-700 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-200"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                            {selectedHistoryEntry ? "Run Details" : "Last 5 Runs"}
                          </span>
                        </div>
                        <button
                          onClick={handleCloseHistoryPanel}
                          className="text-[10px] font-semibold text-zinc-400 hover:text-zinc-700 cursor-pointer dark:text-zinc-500 dark:hover:text-zinc-200"
                        >
                          Close
                        </button>
                      </div>

                      {!selectedHistoryEntry ? (
                        <div className="max-h-64 overflow-y-auto">
                          {history.length === 0 ? (
                            <div className="px-3 py-6 text-center text-[11px] text-zinc-400 italic dark:text-zinc-500">
                              No history yet
                            </div>
                          ) : (
                            history.map((h) => (
                              <button
                                key={h.id}
                                onClick={() => handleOpenHistoryEntry(h.id)}
                                className="w-full flex items-center justify-between px-3 py-2.5 border-b border-zinc-50 last:border-0 hover:bg-zinc-50 cursor-pointer text-left dark:border-zinc-800 dark:hover:bg-zinc-800"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {h.success ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                  ) : (
                                    <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                                  )}
                                  <span className="text-[11px] font-medium text-zinc-700 truncate dark:text-zinc-200">
                                    {new Date(h.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-semibold shrink-0 ${
                                    h.success ? "text-emerald-600" : "text-rose-500"
                                  }`}
                                >
                                  {h.success ? "Success" : "Failed"}
                                </span>
                              </button>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1 px-3 pt-2.5">
                            <button
                              onClick={() => setHistoryTab("request")}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                                historyTab === "request"
                                  ? "bg-[#7c3aed] text-white"
                                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                              }`}
                            >
                              Request
                            </button>
                            <button
                              onClick={() => setHistoryTab("response")}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer ${
                                historyTab === "response"
                                  ? "bg-[#7c3aed] text-white"
                                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700"
                              }`}
                            >
                              Response
                            </button>

                            <button
                              onClick={() =>
                                handleCopyHistoryContent(
                                  historyTab === "request"
                                    ? selectedHistoryEntry.requestJson
                                    : typeof (selectedHistoryEntry.response ?? selectedHistoryEntry.error) === "string"
                                    ? (selectedHistoryEntry.response ?? selectedHistoryEntry.error) as string
                                    : JSON.stringify(selectedHistoryEntry.response ?? selectedHistoryEntry.error, null, 2)
                                )
                              }
                              className="ml-auto flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-100"
                            >
                              {copiedHistory ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                              Copy
                            </button>
                          </div>

                          <pre className="m-3 p-2.5 bg-zinc-50 border border-zinc-150 rounded-lg font-mono text-[10px] text-zinc-700 overflow-auto max-h-56 whitespace-pre-wrap dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                            {historyTab === "request"
                              ? selectedHistoryEntry.requestJson
                              : typeof (selectedHistoryEntry.response ?? selectedHistoryEntry.error) === "string"
                              ? (selectedHistoryEntry.response ?? selectedHistoryEntry.error) as string
                              : JSON.stringify(selectedHistoryEntry.response ?? selectedHistoryEntry.error, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {jsonError ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md dark:text-rose-400 dark:bg-rose-950/30 dark:border-rose-900">
                    <AlertCircle className="h-3 w-3" />
                    Malformed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md dark:text-emerald-400 dark:bg-emerald-950/30 dark:border-emerald-900">
                    <CheckCircle className="h-3 w-3" />
                    Valid JSON
                  </span>
                )}

                <button
                  onClick={handleFormatJson}
                  className="text-[10px] font-bold text-[#7c3aed] hover:underline cursor-pointer"
                >
                  Format
                </button>
              </div>
            </div>

            {/* Monaco Editor Container */}
            <div className="flex-1 min-h-0 relative border border-[#eeebfc] rounded-lg overflow-hidden dark:border-zinc-700">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonBody}
                onChange={(val) => setJsonBody(val || "")}
                theme={theme === "dark" ? "vs-dark" : "light"}
                loading={
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-2 dark:bg-zinc-900">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#7c3aed]" />
                    <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">Loading editor...</span>
                  </div>
                }
                options={{
                  minimap: { enabled: false },
                  fontSize: 12.5,
                  fontFamily: "var(--font-geist-mono), monospace",
                  lineHeight: 18,
                  padding: { top: 8, bottom: 8 },
                  scrollbar: {
                    verticalScrollbarSize: 5,
                    horizontalScrollbarSize: 5,
                  },
                  wordWrap: "on",
                  formatOnPaste: true,
                  formatOnType: true,
                  renderLineHighlight: "all",
                  tabSize: 2,
                }}
              />
            </div>
          </div>

          {/* SECTION 4: Response Body */}
          <div className="bg-white border border-[#eeebfc] rounded-xl p-4 shadow-xs flex-col flex-1 min-h-[220px] lg:min-h-0 flex gap-2.5 dark:bg-zinc-900 dark:border-zinc-800">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-2 dark:border-zinc-800">
              <h2 className="text-xs font-bold text-zinc-800 tracking-wide uppercase shrink-0 dark:text-zinc-100">
                4. Response Body
              </h2>

              <div className="flex items-center gap-3 shrink-0">
                {!isRunning && (response || error) && steps.some((s) => s.duration !== undefined) && (
                  <span
                    className="text-[10px] font-mono font-semibold text-[#7c3aed] whitespace-nowrap cursor-default"
                    title={steps
                      .filter((s) => s.duration !== undefined)
                      .map((s) => `${s.label}: ${s.duration}ms`)
                      .join("  |  ")}
                  >
                    Total: {steps.reduce((sum, s) => sum + (s.duration || 0), 0)}ms
                  </span>
                )}

                {(response || error) && (
                  <button
                    onClick={handleCopyResponse}
                    className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer dark:text-zinc-400 dark:hover:text-zinc-100"
                  >
                    {copiedResponse ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    Copy Output
                  </button>
                )}
              </div>
            </div>

            {/* Response contents */}
            <div className="flex-1 flex flex-col justify-start min-h-0">

              {/* Payment URL alert notification */}
              {paymentUrl && (
                <div className="mb-3.5 flex items-start gap-2.5 p-3 rounded-lg border border-emerald-150 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-650 shrink-0 mt-0.5 dark:text-emerald-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Checkout Session Created</div>
                    <p className="text-[10px] text-emerald-650/90 font-mono break-all mt-0.5 dark:text-emerald-400/90">{paymentUrl}</p>
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-1.5 rounded-md shadow-xs transition-colors"
                    >
                      Open Payment URL
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              )}

              {/* Success / Error code output */}
              {isRunning ? (
                <div className="flex-1 flex flex-col justify-center gap-2.5 px-2">
                  {steps.map((step) => (
                    <div key={step.id} className="flex items-center gap-2.5">
                      {step.status === "success" && (
                        <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      )}
                      {step.status === "running" && (
                        <RefreshCw className="h-4 w-4 text-[#7c3aed] animate-spin shrink-0" />
                      )}
                      {step.status === "failed" && (
                        <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      )}
                      {step.status === "pending" && (
                        <Circle className="h-4 w-4 text-zinc-300 shrink-0 dark:text-zinc-600" />
                      )}

                      <span
                        className={`text-xs font-medium ${
                          step.status === "success"
                            ? "text-zinc-700 dark:text-zinc-300"
                            : step.status === "running"
                            ? "text-zinc-800 font-semibold dark:text-zinc-100"
                            : step.status === "failed"
                            ? "text-rose-600 font-semibold dark:text-rose-400"
                            : "text-zinc-400 dark:text-zinc-600"
                        }`}
                      >
                        {step.label}
                        {step.status === "running" ? "..." : ""}
                      </span>

                      {step.duration !== undefined && (
                        <span className="text-[10px] font-mono text-zinc-400 ml-auto dark:text-zinc-500">
                          {step.duration}ms
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : response ? (
                <pre className="flex-1 p-3.5 bg-zinc-50 border border-zinc-150 rounded-lg font-mono text-[11px] text-zinc-700 overflow-auto max-h-[300px] leading-relaxed dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : error && typeof error !== "string" ? (
                <div className="flex-1 p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 font-mono text-[11px] overflow-auto max-h-[300px] flex flex-col gap-3 dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-300">
                  <div className="flex items-center justify-between">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                      {error.step} Failed
                    </div>
                    <div className="flex items-center gap-2">
                      {error.status !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[10px]">
                          {error.status} {error.statusText || ""}
                        </span>
                      )}
                      {error.duration !== undefined && (
                        <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700 font-bold text-[10px] dark:bg-zinc-700 dark:text-zinc-200">
                          {error.duration}ms
                        </span>
                      )}
                    </div>
                  </div>

                  <pre className="text-rose-600 leading-normal whitespace-pre-wrap dark:text-rose-300">{error.message}</pre>

                  {error.data !== undefined && error.data !== null && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-rose-400 dark:text-rose-400">Response Body</span>
                      <pre className="p-3 bg-white border border-rose-100 rounded-lg text-zinc-700 overflow-auto max-h-[180px] whitespace-pre-wrap dark:bg-zinc-900 dark:border-rose-900 dark:text-zinc-200">
                        {typeof error.data === "string" ? error.data : JSON.stringify(error.data, null, 2)}
                      </pre>
                    </div>
                  )}

                  {error.headers && Object.keys(error.headers).length > 0 && (
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => setShowHeaders((prev) => !prev)}
                        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-rose-400 hover:text-rose-600 cursor-pointer w-fit dark:text-rose-400 dark:hover:text-rose-300"
                      >
                        {showHeaders ? (
                          <ChevronDown className="h-3 w-3" />
                        ) : (
                          <ChevronRight className="h-3 w-3" />
                        )}
                        {showHeaders ? "Hide Headers" : "Show Headers"}
                      </button>
                      {showHeaders && (
                        <pre className="p-3 bg-white border border-rose-100 rounded-lg text-zinc-700 overflow-auto max-h-[120px] whitespace-pre-wrap dark:bg-zinc-900 dark:border-rose-900 dark:text-zinc-200">
                          {JSON.stringify(error.headers, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ) : error ? (
                <div className="flex-1 p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 font-mono text-[11px] overflow-auto max-h-[300px] dark:bg-rose-950/20 dark:border-rose-900 dark:text-rose-300">
                  <div className="font-bold flex items-center gap-1.5 mb-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                    Execution Failed
                  </div>
                  <pre className="text-rose-600 leading-normal whitespace-pre-wrap dark:text-rose-300">{error}</pre>
                </div>
              ) : (
                <div className="flex-1 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 text-xs italic py-12 dark:border-zinc-700 dark:text-zinc-500">
                  Awaiting generation. Populate credentials and click "Generate Session".
                </div>
              )}

            </div>
          </div>

        </div>

      </main>

      {/* Global Notifications */}
      <ToastContainer toasts={toasts} />
    </div>
  );
}
