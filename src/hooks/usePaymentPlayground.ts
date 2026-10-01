import { useState, useEffect, useCallback, useRef } from "react";
import { executeApiStep, isAbortError } from "@/services/api";

export interface ApiErrorDetail {
  step: string;
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, string>;
  duration?: number;
  message: string;
}

export type StepStatus = "pending" | "running" | "success" | "failed";

export interface StepState {
  id: string;
  label: string;
  status: StepStatus;
  duration?: number;
  requestUrl?: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseStatus?: number;
  responseStatusText?: string;
  responseData?: any;
  responseHeaders?: Record<string, string>;
}

const STEP_DEFS: Array<{ id: string; label: string }> = [
  { id: "hencr", label: "Header Secrets Encrypted" },
  { id: "encr", label: "Request Body Encrypted" },
  { id: "session", label: "Payment Session Created" },
  { id: "decr", label: "Response Decrypted" },
];

export interface HistoryEntry {
  id: string;
  timestamp: number;
  success: boolean;
  requestJson: string;
  response?: any;
  error?: ApiErrorDetail | string;
  steps?: StepState[];
}

const MAX_HISTORY = 5;

export interface SavedPreset {
  id: string;
  merchant: string;
  environment: string;
  accountLabel: string;
  clientId: string;
  clientSecret: string;
  encryptionKey: string;
  passKey: string;
  mid?: string;
}

const DEFAULT_JSON = `{
  "order_id": "ORDER_${Math.floor(1000 + Math.random() * 9000)}",
  "amount": "1788.00",
  "currency": "INR",
  "action": "paymentPage",
  "mode": "web",
  "return_url": "https://merchant.com/checkout/status",
  "customer_id": "CUST_${Math.floor(10000 + Math.random() * 90000)}",
  "customer_email": "alex.hunter@example.com",
  "customer_phone": "9999999999",
  "first_name": "Alex",
  "last_name": "Hunter",
  "description": "Premium Subscription"
}`;

const DEFAULT_SESSION_URL = "https://api-uat-mpurse.txninfra.com/mpurse/super-switch/v1/payments/session";

export function usePaymentPlayground() {
  // Core Credentials
  const [clientId, setClientId] = useState<string>("");
  const [clientSecret, setClientSecret] = useState<string>("");
  const [encryptionKey, setEncryptionKey] = useState<string>("");
  const [passKey, setPassKey] = useState<string>("");
  const [mid, setMid] = useState<string>("");
  const [sessionUrl, setSessionUrl] = useState<string>(DEFAULT_SESSION_URL);

  // Request Body
  const [jsonBody, setJsonBody] = useState<string>(DEFAULT_JSON);

  // Execution States
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | ApiErrorDetail | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | undefined>(undefined);
  const [steps, setSteps] = useState<StepState[]>(
    STEP_DEFS.map((s) => ({ ...s, status: "pending" }))
  );
  // Mirrors `steps` synchronously so history entries can read the latest value
  // without waiting on React's async state batching.
  const stepsRef = useRef<StepState[]>(STEP_DEFS.map((s) => ({ ...s, status: "pending" })));
  const abortControllerRef = useRef<AbortController | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [savedPresets, setSavedPresets] = useState<SavedPreset[]>([]);

  // Toast System
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: "success" | "error" | "info" }>>([]);

  // Load from LocalStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setClientId(localStorage.getItem("mpurse_client_id") || "");
      setClientSecret(localStorage.getItem("mpurse_client_secret") || "");
      setEncryptionKey(localStorage.getItem("mpurse_encryption_key") || "");
      setPassKey(localStorage.getItem("mpurse_pass_key") || "");
      setMid(localStorage.getItem("mpurse_mid") || "");
      setSessionUrl(localStorage.getItem("mpurse_session_url") || DEFAULT_SESSION_URL);
      
      const savedJson = localStorage.getItem("mpurse_json_body");
      if (savedJson) {
        setJsonBody(savedJson);
      }

      const savedHistory = localStorage.getItem("mpurse_history");
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (_) {}
      }

      const savedPresetsRaw = localStorage.getItem("mpurse_saved_presets");
      if (savedPresetsRaw) {
        try {
          setSavedPresets(JSON.parse(savedPresetsRaw));
        } catch (_) {}
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem("mpurse_client_id", clientId);
  }, [clientId]);

  useEffect(() => {
    localStorage.setItem("mpurse_client_secret", clientSecret);
  }, [clientSecret]);

  useEffect(() => {
    localStorage.setItem("mpurse_encryption_key", encryptionKey);
  }, [encryptionKey]);

  useEffect(() => {
    localStorage.setItem("mpurse_pass_key", passKey);
  }, [passKey]);

  useEffect(() => {
    localStorage.setItem("mpurse_mid", mid);
  }, [mid]);

  useEffect(() => {
    localStorage.setItem("mpurse_session_url", sessionUrl);
  }, [sessionUrl]);

  useEffect(() => {
    localStorage.setItem("mpurse_json_body", jsonBody);
  }, [jsonBody]);

  // Toast Trigger Helper
  const showToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  // Scan JSON object recursively for anything resembling a URL or standard payment field
  const findPaymentUrlRecursive = (obj: any): string | undefined => {
    if (!obj) return undefined;
    
    // Check known payment URL fields first
    const knownFields = ["paymentUrl", "payment_url", "paymentPageUrl", "url", "redirectUrl", "checkoutUrl", "paymentUri"];
    for (const key of knownFields) {
      if (typeof obj[key] === "string" && obj[key].startsWith("http")) {
        return obj[key];
      }
    }

    // Deep search
    if (typeof obj === "object") {
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const val = obj[key];
          if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
            return val;
          }
          if (typeof val === "object") {
            const found = findPaymentUrlRecursive(val);
            if (found) return found;
          }
        }
      }
    }
    return undefined;
  };

  // Update a single step's progress state (keeps stepsRef in sync for history snapshots)
  const updateStep = (id: string, patch: Partial<StepState>) => {
    setSteps((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...patch } : s));
      stepsRef.current = updated;
      return updated;
    });
  };

  // Build a Postman-style structured error from a failed step's raw result
  const failStep = (stepId: string, result: {
    status?: number;
    statusText?: string;
    data?: any;
    headers?: Record<string, string>;
    duration?: number;
    error?: string;
  }) => {
    const stepDef = STEP_DEFS.find((s) => s.id === stepId);
    const step = stepDef ? stepDef.label : stepId;

    let message: string = result.error || "";
    if (!message && result.data && typeof result.data === "object") {
      message = result.data.error || result.data.message || "";
    }
    if (!message && typeof result.data === "string") {
      message = result.data;
    }
    if (!message) {
      message = `${step} failed`;
    }

    updateStep(stepId, {
      status: "failed",
      duration: result.duration,
      responseStatus: result.status,
      responseStatusText: result.statusText,
      responseData: result.data,
      responseHeaders: result.headers,
    });

    const errorDetail: ApiErrorDetail = {
      step,
      status: result.status,
      statusText: result.statusText,
      data: result.data,
      headers: result.headers,
      duration: result.duration,
      message,
    };

    setError(errorDetail);
    addHistoryEntry({ success: false, requestJson: jsonBody, error: errorDetail, steps: stepsRef.current });
    showToast(`${step} failed${result.status ? ` (${result.status})` : ""}`, "error");
    setIsRunning(false);
  };

  // Save a completed run (success or failure) into persisted history, capped at MAX_HISTORY
  const addHistoryEntry = (entry: Omit<HistoryEntry, "id" | "timestamp">) => {
    setHistory((prev) => {
      const newEntry: HistoryEntry = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        ...entry,
      };
      const updated = [newEntry, ...prev].slice(0, MAX_HISTORY);
      if (typeof window !== "undefined") {
        localStorage.setItem("mpurse_history", JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Remove a single history entry
  const deleteHistoryEntry = (id: string) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("mpurse_history", JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Clear all history entries
  const clearHistory = () => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("mpurse_history");
    }
  };

  // Save the currently entered credentials as a named preset
  const addSavedPreset = (entry: Omit<SavedPreset, "id">) => {
    setSavedPresets((prev) => {
      const newPreset: SavedPreset = {
        id: Math.random().toString(36).substring(2, 9),
        ...entry,
      };
      const updated = [...prev, newPreset];
      if (typeof window !== "undefined") {
        localStorage.setItem("mpurse_saved_presets", JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Remove a single saved preset
  const deleteSavedPreset = (id: string) => {
    setSavedPresets((prev) => {
      const updated = prev.filter((p) => p.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("mpurse_saved_presets", JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Clear only the 5 credential fields (Client ID, Secret, Encryption Key, Pass Key, MID)
  const clearCredentials = () => {
    setClientId("");
    setClientSecret("");
    setEncryptionKey("");
    setPassKey("");
    setMid("");
    showToast("Credentials cleared", "info");
  };

  // Main Execute Sequence
  const executePlaygroundFlow = async () => {
    if (isRunning) return;

    // Standard Client-side JSON checking
    let parsedJson = null;
    try {
      parsedJson = JSON.parse(jsonBody);
    } catch (e: any) {
      showToast("Invalid JSON syntax in request body", "error");
      setError("JSON Parsing Error: " + e.message);
      return;
    }

    if (!clientId || !clientSecret) {
      showToast("Client ID and Client Secret are required", "error");
      return;
    }

    if (!encryptionKey) {
      showToast("Encryption Key is required", "error");
      return;
    }

    if (!passKey) {
      showToast("Pass Key is required", "error");
      return;
    }

    setIsRunning(true);
    setResponse(null);
    setError(null);
    setPaymentUrl(undefined);
    const freshSteps = STEP_DEFS.map((s) => ({ ...s, status: "pending" as StepStatus }));
    setSteps(freshSteps);
    stepsRef.current = freshSteps;

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // STEP 1: Call Header Encryption API
      const hencrUrl = "https://encr-decr.iserveu.online/hencr";
      const hencrHeaders = { key: encryptionKey };
      const hencrBody = { client_id: clientId, client_secret: clientSecret };
      updateStep("hencr", {
        status: "running",
        requestUrl: hencrUrl,
        requestHeaders: hencrHeaders,
        requestBody: hencrBody,
      });
      const resStep1 = await executeApiStep(
        hencrUrl,
        "POST",
        hencrHeaders,
        hencrBody,
        true, // Always use proxy under-the-hood to prevent CORS
        controller.signal
      );

      if (!resStep1.success || !resStep1.data?.RequestData) {
        failStep("hencr", resStep1);
        return;
      }
      updateStep("hencr", {
        status: "success",
        duration: resStep1.duration,
        responseStatus: resStep1.status,
        responseStatusText: resStep1.statusText,
        responseData: resStep1.data,
        responseHeaders: resStep1.headers,
      });

      const encryptedHeaderSecret = resStep1.data.RequestData;

      // STEP 2: Call Request Body Encryption API
      const encrUrl = "https://encr-decr.iserveu.online/encr";
      const encrHeaders = { key: encryptionKey };
      updateStep("encr", {
        status: "running",
        requestUrl: encrUrl,
        requestHeaders: encrHeaders,
        requestBody: parsedJson,
      });
      const resStep2 = await executeApiStep(
        encrUrl,
        "POST",
        encrHeaders,
        parsedJson,
        true,
        controller.signal
      );

      if (!resStep2.success || !resStep2.data?.RequestData) {
        failStep("encr", resStep2);
        return;
      }
      updateStep("encr", {
        status: "success",
        duration: resStep2.duration,
        responseStatus: resStep2.status,
        responseStatusText: resStep2.statusText,
        responseData: resStep2.data,
        responseHeaders: resStep2.headers,
      });

      const encryptedRequestBody = resStep2.data.RequestData;

      // STEP 3: Create Payment Session
      const sessionApiUrl = sessionUrl || DEFAULT_SESSION_URL;
      const sessionHeaders = {
        pass_key: passKey,
        header_secrets: encryptedHeaderSecret,
        mid: mid || "null"
      };
      const sessionBody = { RequestData: encryptedRequestBody };
      updateStep("session", {
        status: "running",
        requestUrl: sessionApiUrl,
        requestHeaders: sessionHeaders,
        requestBody: sessionBody,
      });
      const resStep3 = await executeApiStep(
        sessionApiUrl,
        "POST",
        sessionHeaders,
        sessionBody,
        true,
        controller.signal
      );

      if (!resStep3.success) {
        failStep("session", resStep3);
        return;
      }
      updateStep("session", {
        status: "success",
        duration: resStep3.duration,
        responseStatus: resStep3.status,
        responseStatusText: resStep3.statusText,
        responseData: resStep3.data,
        responseHeaders: resStep3.headers,
      });

      // STEP 4: Automatically extract ResponseData
      let sessionData = resStep3.data;
      if (typeof sessionData === "string") {
        try {
          sessionData = JSON.parse(sessionData);
        } catch (_) {}
      }

      let encryptedResponseData = "";
      if (sessionData && typeof sessionData === "object") {
        // Extract the raw string value of ResponseData
        encryptedResponseData = sessionData.ResponseData || sessionData.RequestData || "";
      } else if (typeof sessionData === "string") {
        encryptedResponseData = sessionData;
      }

      if (!encryptedResponseData) {
        // If there is no encrypted ResponseData string, display the raw response
        setResponse(resStep3.data);
        addHistoryEntry({ success: true, requestJson: jsonBody, response: resStep3.data, steps: stepsRef.current });
        const parsedUrl = findPaymentUrlRecursive(resStep3.data);
        if (parsedUrl) {
          setPaymentUrl(parsedUrl);
        }
        showToast("Session Generated (Payload was unencrypted)", "success");
        return;
      }

      // STEP 5: Automatically call decryption API (/decr)
      const decrUrl = "https://encr-decr.iserveu.online/decr";
      const decrHeaders = { key: encryptionKey };
      const decrBody = { req: encryptedResponseData };
      updateStep("decr", {
        status: "running",
        requestUrl: decrUrl,
        requestHeaders: decrHeaders,
        requestBody: decrBody,
      });
      const resDecr = await executeApiStep(
        decrUrl,
        "POST",
        decrHeaders,
        decrBody,
        true,
        controller.signal
      );

      if (!resDecr.success) {
        failStep("decr", resDecr);
        return;
      }
      updateStep("decr", {
        status: "success",
        duration: resDecr.duration,
        responseStatus: resDecr.status,
        responseStatusText: resDecr.statusText,
        responseData: resDecr.data,
        responseHeaders: resDecr.headers,
      });

      // STEP 6: Render ONLY the FINAL DECRYPTED RESPONSE
      let decryptedData = resDecr.data;
      if (typeof decryptedData === "string") {
        try {
          decryptedData = JSON.parse(decryptedData);
        } catch (_) {}
      }

      setResponse(decryptedData);
      addHistoryEntry({ success: true, requestJson: jsonBody, response: decryptedData, steps: stepsRef.current });

      const parsedUrl = findPaymentUrlRecursive(decryptedData);
      if (parsedUrl) {
        setPaymentUrl(parsedUrl);
        showToast("Payment Session Generated & Decrypted!", "success");
      } else {
        showToast("Session decrypted, but no redirect URL detected", "info");
      }

    } catch (err: any) {
      if (isAbortError(err)) {
        const pendingSteps = STEP_DEFS.map((s) => ({ ...s, status: "pending" as StepStatus }));
        setSteps(pendingSteps);
        stepsRef.current = pendingSteps;
        showToast("Request cancelled", "info");
      } else {
        const message = err.message || "An unexpected error occurred during execution";
        setError(message);
        addHistoryEntry({ success: false, requestJson: jsonBody, error: message, steps: stepsRef.current });
        showToast("Playground execution failed", "error");
      }
    } finally {
      setIsRunning(false);
      abortControllerRef.current = null;
    }
  };

  // Cancel the currently running flow, if any
  const cancelPlaygroundFlow = () => {
    abortControllerRef.current?.abort();
  };

  // Reset all states
  const resetPlayground = () => {
    abortControllerRef.current?.abort();
    setClientId("");
    setClientSecret("");
    setEncryptionKey("");
    setPassKey("");
    setMid("");
    setSessionUrl(DEFAULT_SESSION_URL);
    setJsonBody(DEFAULT_JSON);
    setResponse(null);
    setError(null);
    setPaymentUrl(undefined);
    setSteps(STEP_DEFS.map((s) => ({ ...s, status: "pending" })));
    showToast("Credentials and payload reset", "info");
  };

  return {
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
    deleteHistoryEntry,
    clearHistory,
    savedPresets,
    addSavedPreset,
    deleteSavedPreset,
    clearCredentials,
    toasts,
    executePlaygroundFlow,
    cancelPlaygroundFlow,
    resetPlayground,
    showToast
  };
}
