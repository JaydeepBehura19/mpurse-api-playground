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
  Trash2
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
    toasts,
    executePlaygroundFlow,
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
    <div className="min-h-screen bg-[#faf9ff] text-[#1e1b4b] flex flex-col antialiased">

      {/* Premium Minimal Header */}
      <header className="w-full bg-white border-b border-[#eeebfc] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-[#7c3aed] flex items-center justify-center text-white font-bold text-sm">
            M
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900">
              MPurse API Playground
            </h1>
            <p className="text-[10px] font-medium text-zinc-400">
              Internal Gateway Testing Utility
            </p>
          </div>
        </div>

        <button
          onClick={resetPlayground}
          className="flex items-center gap-1.5 px-2.5 py-1.5 border border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50 rounded-md text-[11px] font-semibold text-zinc-600 transition-colors duration-150 cursor-pointer"
          title="Clear all local configurations"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Reset
        </button>
      </header>

      {/* Main Grid Canvas */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0 overflow-y-auto">

        {/* LEFT COLUMN: Section 1 (Credentials) & Section 3 (Hit API) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* SECTION 1: API Credentials */}
          <div className="bg-white border border-[#eeebfc] rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-50 pb-2.5">
              <Key className="h-4 w-4 text-[#7c3aed]" />
              <h2 className="text-xs font-bold text-zinc-800 tracking-wide uppercase">
                1. API Credentials
              </h2>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Client ID */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Client ID
                </label>
                <input
                  type="text"
                  placeholder="Enter merchant client id..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-white border border-[#eeebfc] rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                />
              </div>

              {/* Client Secret */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Client Secret
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    placeholder="Enter client secret..."
                    value={clientSecret}
                    onChange={(e) => setClientSecret(e.target.value)}
                    className="w-full bg-white border border-[#eeebfc] rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                  >
                    {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Encryption Key */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Encryption Key
                </label>
                <div className="relative">
                  <input
                    type={showEncKey ? "text" : "password"}
                    placeholder="Enter payload encryption key..."
                    value={encryptionKey}
                    onChange={(e) => setEncryptionKey(e.target.value)}
                    className="w-full bg-white border border-[#eeebfc] rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEncKey(!showEncKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                  >
                    {showEncKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Pass Key */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Pass Key
                </label>
                <div className="relative">
                  <input
                    type={showPassKey ? "text" : "password"}
                    placeholder="Enter gateway authorization pass key..."
                    value={passKey}
                    onChange={(e) => setPassKey(e.target.value)}
                    className="w-full bg-white border border-[#eeebfc] rounded-lg pl-3 pr-9 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassKey(!showPassKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-650 cursor-pointer"
                  >
                    {showPassKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* MID */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  MID
                </label>
                <input
                  type="text"
                  placeholder="Enter merchant id..."
                  value={mid}
                  onChange={(e) => setMid(e.target.value)}
                  className="w-full bg-white border border-[#eeebfc] rounded-lg px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Hit API Section */}
          <div className="bg-white border border-[#eeebfc] rounded-xl p-5 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-zinc-50 pb-2.5">
              <Play className="h-4 w-4 text-[#7c3aed] fill-[#7c3aed]/10" />
              <h2 className="text-xs font-bold text-zinc-800 tracking-wide uppercase">
                3. Hit API Section
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                  Payment Session API URL
                </label>
                <textarea
                  placeholder="Enter session URL..."
                  value={sessionUrl}
                  onChange={(e) => setSessionUrl(e.target.value)}
                  rows={2}
                  className="w-full bg-white border border-[#eeebfc] rounded-lg px-3 py-2 text-[11px] font-mono text-zinc-700 focus:outline-hidden focus:ring-1 focus:ring-[#7c3aed] focus:border-[#7c3aed] transition-all resize-none break-all"
                />
              </div>

              <button
                onClick={executePlaygroundFlow}
                disabled={isRunning}
                className={`w-full py-2.5 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:bg-[#a78bfa] text-white rounded-lg text-xs font-semibold shadow-sm transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  isRunning ? "cursor-wait opacity-85" : ""
                }`}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Generating...</span>
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
        <div className="lg:col-span-7 flex flex-col gap-6">

          {/* SECTION 2: Request Body JSON */}
          <div className="bg-white border border-[#eeebfc] rounded-xl p-5 shadow-xs flex flex-col gap-3 min-h-[300px] lg:h-[350px]">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-2">
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-[#7c3aed]" />
                <h2 className="text-xs font-bold text-zinc-800 tracking-wide uppercase">
                  2. Request Body JSON
                </h2>
              </div>

              {/* Status & formatting button */}
              <div className="flex items-center gap-3">
                {jsonError ? (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                    <AlertCircle className="h-3 w-3" />
                    Malformed
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
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
            <div className="flex-1 min-h-0 relative border border-[#eeebfc] rounded-lg overflow-hidden">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonBody}
                onChange={(val) => setJsonBody(val || "")}
                theme="light"
                loading={
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-white gap-2">
                    <RefreshCw className="h-5 w-5 animate-spin text-[#7c3aed]" />
                    <span className="text-[10px] font-bold text-zinc-400">Loading editor...</span>
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
          <div className="bg-white border border-[#eeebfc] rounded-xl p-5 shadow-xs flex-col flex-1 min-h-[250px] flex gap-3">
            <div className="flex items-center justify-between border-b border-zinc-50 pb-2">
              <h2 className="text-xs font-bold text-zinc-800 tracking-wide uppercase">
                4. Response Body
              </h2>

              {(response || error) && (
                <button
                  onClick={handleCopyResponse}
                  className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-800 cursor-pointer"
                >
                  {copiedResponse ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy Output
                </button>
              )}
            </div>

            {/* Response contents */}
            <div className="flex-1 flex flex-col justify-start min-h-0">

              {/* Payment URL alert notification */}
              {paymentUrl && (
                <div className="mb-3.5 flex items-start gap-2.5 p-3 rounded-lg border border-emerald-150 bg-emerald-50/50">
                  <CheckCircle className="h-4.5 w-4.5 text-emerald-650 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-emerald-800">Checkout Session Created</div>
                    <p className="text-[10px] text-emerald-650/90 font-mono break-all mt-0.5">{paymentUrl}</p>
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
              {response ? (
                <pre className="flex-1 p-3.5 bg-zinc-50 border border-zinc-150 rounded-lg font-mono text-[11px] text-zinc-700 overflow-auto max-h-[300px] leading-relaxed">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : error ? (
                <div className="flex-1 p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-700 font-mono text-[11px] overflow-auto max-h-[300px]">
                  <div className="font-bold flex items-center gap-1.5 mb-2">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-rose-500" />
                    Execution Failed
                  </div>
                  <pre className="text-rose-600 leading-normal whitespace-pre-wrap">{error}</pre>
                </div>
              ) : (
                <div className="flex-1 border border-dashed border-zinc-200 rounded-lg flex items-center justify-center text-zinc-400 text-xs italic py-12">
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
