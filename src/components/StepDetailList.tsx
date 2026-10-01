import React, { useState } from "react";
import { CheckCircle, AlertCircle, Circle, ChevronRight, ChevronDown } from "lucide-react";
import type { StepState } from "@/hooks/usePaymentPlayground";

interface StepDetailListProps {
  steps: StepState[];
}

function renderJson(value: any): string {
  if (value === undefined || value === null) return "—";
  return typeof value === "string" ? value : JSON.stringify(value, null, 2);
}

export function StepDetailList({ steps }: StepDetailListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showReqHeaders, setShowReqHeaders] = useState(false);
  const [showResHeaders, setShowResHeaders] = useState(false);

  const toggleStep = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
    setShowReqHeaders(false);
    setShowResHeaders(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {steps.map((step) => {
        const isExpanded = expandedId === step.id;
        const hasDetail = step.requestUrl || step.responseData !== undefined;

        return (
          <div
            key={step.id}
            className="border border-zinc-100 rounded-lg overflow-hidden dark:border-zinc-800"
          >
            <button
              type="button"
              onClick={() => hasDetail && toggleStep(step.id)}
              disabled={!hasDetail}
              className={`w-full flex items-center gap-2 px-2.5 py-2 text-left ${
                hasDetail ? "cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800" : "cursor-default"
              }`}
            >
              {step.status === "success" && <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
              {step.status === "failed" && <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />}
              {step.status === "pending" && <Circle className="h-3.5 w-3.5 text-zinc-300 shrink-0 dark:text-zinc-600" />}
              {step.status === "running" && <Circle className="h-3.5 w-3.5 text-[#7c3aed] shrink-0" />}

              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-200 flex-1">
                {step.label}
              </span>

              {step.duration !== undefined && (
                <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">{step.duration}ms</span>
              )}

              {hasDetail && (
                isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5 text-zinc-400 shrink-0 dark:text-zinc-500" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 shrink-0 dark:text-zinc-500" />
                )
              )}
            </button>

            {isExpanded && (
              <div className="px-2.5 pb-2.5 flex flex-col gap-2 border-t border-zinc-100 pt-2 dark:border-zinc-800">
                {step.requestUrl && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Request URL
                    </span>
                    <p className="text-[10.5px] font-mono text-zinc-600 break-all dark:text-zinc-300">
                      {step.requestUrl}
                    </p>
                  </div>
                )}

                {step.requestBody !== undefined && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      Request Body
                    </span>
                    <pre className="p-2 bg-zinc-50 border border-zinc-100 rounded-md text-[10.5px] text-zinc-700 overflow-auto max-h-32 whitespace-pre-wrap dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                      {renderJson(step.requestBody)}
                    </pre>
                  </div>
                )}

                {step.requestHeaders && Object.keys(step.requestHeaders).length > 0 && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setShowReqHeaders((p) => !p)}
                      className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-zinc-400 hover:text-zinc-600 cursor-pointer w-fit dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      {showReqHeaders ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      Request Headers
                    </button>
                    {showReqHeaders && (
                      <pre className="p-2 bg-zinc-50 border border-zinc-100 rounded-md text-[10.5px] text-zinc-700 overflow-auto max-h-28 whitespace-pre-wrap dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                        {renderJson(step.requestHeaders)}
                      </pre>
                    )}
                  </div>
                )}

                {step.responseData !== undefined && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-bold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                        Response Body
                      </span>
                      {step.responseStatus !== undefined && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold text-white ${
                            step.status === "failed" ? "bg-rose-500" : "bg-emerald-600"
                          }`}
                        >
                          {step.responseStatus} {step.responseStatusText || ""}
                        </span>
                      )}
                    </div>
                    <pre className="p-2 bg-zinc-50 border border-zinc-100 rounded-md text-[10.5px] text-zinc-700 overflow-auto max-h-32 whitespace-pre-wrap dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                      {renderJson(step.responseData)}
                    </pre>
                  </div>
                )}

                {step.responseHeaders && Object.keys(step.responseHeaders).length > 0 && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setShowResHeaders((p) => !p)}
                      className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wide text-zinc-400 hover:text-zinc-600 cursor-pointer w-fit dark:text-zinc-500 dark:hover:text-zinc-300"
                    >
                      {showResHeaders ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      Response Headers
                    </button>
                    {showResHeaders && (
                      <pre className="p-2 bg-zinc-50 border border-zinc-100 rounded-md text-[10.5px] text-zinc-700 overflow-auto max-h-28 whitespace-pre-wrap dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                        {renderJson(step.responseHeaders)}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
