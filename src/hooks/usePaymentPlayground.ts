import { useState, useEffect, useCallback } from "react";
import { executeApiStep } from "@/services/api";

export interface ApiErrorDetail {
  step: string;
  status?: number;
  statusText?: string;
  data?: any;
  headers?: Record<string, string>;
  duration?: number;
  message: string;
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

  // Build a Postman-style structured error from a failed step's raw result
  const failStep = (step: string, result: {
    status?: number;
    statusText?: string;
    data?: any;
    headers?: Record<string, string>;
    duration?: number;
    error?: string;
  }) => {
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

    setError({
      step,
      status: result.status,
      statusText: result.statusText,
      data: result.data,
      headers: result.headers,
      duration: result.duration,
      message,
    });
    showToast(`${step} failed${result.status ? ` (${result.status})` : ""}`, "error");
    setIsRunning(false);
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

    try {
      // STEP 1: Call Header Encryption API
      const resStep1 = await executeApiStep(
        "https://encr-decr.iserveu.online/hencr",
        "POST",
        { key: encryptionKey },
        { client_id: clientId, client_secret: clientSecret },
        true // Always use proxy under-the-hood to prevent CORS
      );

      if (!resStep1.success || !resStep1.data?.RequestData) {
        failStep("Header Encryption (/hencr)", resStep1);
        return;
      }

      const encryptedHeaderSecret = resStep1.data.RequestData;

      // STEP 2: Call Request Body Encryption API
      const resStep2 = await executeApiStep(
        "https://encr-decr.iserveu.online/encr",
        "POST",
        { key: encryptionKey },
        parsedJson,
        true
      );

      if (!resStep2.success || !resStep2.data?.RequestData) {
        failStep("Request Body Encryption (/encr)", resStep2);
        return;
      }

      const encryptedRequestBody = resStep2.data.RequestData;

      // STEP 3: Create Payment Session
      const resStep3 = await executeApiStep(
        sessionUrl || DEFAULT_SESSION_URL,
        "POST",
        {
          pass_key: passKey,
          header_secrets: encryptedHeaderSecret,
          mid: mid || "null"
        },
        {
          RequestData: encryptedRequestBody
        },
        true
      );

      if (!resStep3.success) {
        failStep("Payment Session Creation", resStep3);
        return;
      }

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
        const parsedUrl = findPaymentUrlRecursive(resStep3.data);
        if (parsedUrl) {
          setPaymentUrl(parsedUrl);
        }
        showToast("Session Generated (Payload was unencrypted)", "success");
        return;
      }

      // STEP 5: Automatically call decryption API (/decr)
      const resDecr = await executeApiStep(
        "https://encr-decr.iserveu.online/decr",
        "POST",
        { key: encryptionKey },
        { req: encryptedResponseData },
        true
      );

      if (!resDecr.success) {
        failStep("Response Decryption (/decr)", resDecr);
        return;
      }

      // STEP 6: Render ONLY the FINAL DECRYPTED RESPONSE
      let decryptedData = resDecr.data;
      if (typeof decryptedData === "string") {
        try {
          decryptedData = JSON.parse(decryptedData);
        } catch (_) {}
      }

      setResponse(decryptedData);

      const parsedUrl = findPaymentUrlRecursive(decryptedData);
      if (parsedUrl) {
        setPaymentUrl(parsedUrl);
        showToast("Payment Session Generated & Decrypted!", "success");
      } else {
        showToast("Session decrypted, but no redirect URL detected", "info");
      }

    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during execution");
      showToast("Playground execution failed", "error");
    } finally {
      setIsRunning(false);
    }
  };

  // Reset all states
  const resetPlayground = () => {
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
    toasts,
    executePlaygroundFlow,
    resetPlayground,
    showToast
  };
}
