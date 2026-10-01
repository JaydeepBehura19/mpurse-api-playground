import axios from "axios";

interface ExecutionResult {
  success: boolean;
  status: number;
  statusText: string;
  data: any;
  headers: Record<string, string>;
  duration: number;
  error?: string;
}

/**
 * True if the given error represents a user/caller-initiated abort, not a real failure.
 */
export function isAbortError(err: any): boolean {
  return axios.isCancel(err) || err?.code === "ERR_CANCELED" || err?.name === "CanceledError";
}

/**
 * Execute an API step, automatically choosing between client-direct and proxy routing.
 */
export async function executeApiStep(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
  useProxy: boolean = true,
  signal?: AbortSignal
): Promise<ExecutionResult> {
  const startTime = Date.now();

  if (useProxy) {
    try {
      const response = await axios.post(
        "/api/proxy",
        {
          url,
          method,
          headers,
          body,
        },
        { signal }
      );

      const proxyData = response.data;

      if (proxyData.error) {
        return {
          success: false,
          status: proxyData.status || 500,
          statusText: "Proxy Error",
          data: proxyData.details || null,
          headers: {},
          duration: proxyData.duration || (Date.now() - startTime),
          error: proxyData.error,
        };
      }

      return {
        success: proxyData.success,
        status: proxyData.status,
        statusText: proxyData.statusText || "",
        data: proxyData.data,
        headers: proxyData.headers || {},
        duration: proxyData.duration || (Date.now() - startTime),
      };
    } catch (err: any) {
      if (isAbortError(err)) throw err;
      return {
        success: false,
        status: 500,
        statusText: "Client Exception",
        data: null,
        headers: {},
        duration: Date.now() - startTime,
        error: err.message || "Failed to contact local API proxy server",
      };
    }
  } else {
    // Direct browser call
    try {
      const response = await axios({
        url,
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        data: body,
        timeout: 15000,
        validateStatus: () => true,
        signal,
      });

      return {
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers as any,
        duration: Date.now() - startTime,
      };
    } catch (err: any) {
      if (isAbortError(err)) throw err;
      return {
        success: false,
        status: err.response?.status || 500,
        statusText: "Network Error",
        data: err.response?.data || null,
        headers: err.response?.headers as any || {},
        duration: Date.now() - startTime,
        error: err.message || "Network error. Possible CORS policy block or DNS failure.",
      };
    }
  }
}
