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
 * Execute an API step, automatically choosing between client-direct and proxy routing.
 */
export async function executeApiStep(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any,
  useProxy: boolean = true
): Promise<ExecutionResult> {
  const startTime = Date.now();

  if (useProxy) {
    try {
      const response = await axios.post("/api/proxy", {
        url,
        method,
        headers,
        body,
      });

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

/**
 * Generate a copyable curl command representation for a request step.
 */
export function generateCurlCommand(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: any
): string {
  let curl = `curl --location --request ${method.toUpperCase()} '${url}' \\\n`;

  // Headers
  const headerKeys = Object.keys(headers);
  headerKeys.forEach((key, index) => {
    const isLast = index === headerKeys.length - 1 && !body;
    curl += `--header '${key}: ${headers[key]}'${isLast ? "" : " \\\n"}`;
  });

  // Body
  if (body) {
    const formattedBody = typeof body === "string" ? body : JSON.stringify(body, null, 2);
    // Escape single quotes inside body for bash safety
    const escapedBody = formattedBody.replace(/'/g, "'\\''");
    curl += `--data-raw '${escapedBody}'`;
  }

  return curl;
}

/**
 * Test connectivity to an API endpoint (returns ping duration or error).
 */
export async function testConnection(
  url: string,
  useProxy: boolean = true
): Promise<{ online: boolean; latency?: number; error?: string }> {
  const host = new URL(url).origin;
  const startTime = Date.now();
  
  if (useProxy) {
    try {
      const response = await axios.post("/api/proxy", {
        url: host, // ping host
        method: "GET",
        headers: {},
        body: null,
      });
      
      const duration = Date.now() - startTime;
      // If we got any response, even a 404, the server is reachable
      const online = response.data.status !== undefined && response.data.status !== 500;
      return { 
        online: response.data.success || response.data.status < 500, 
        latency: response.data.duration || duration,
        error: response.data.error || undefined
      };
    } catch (err: any) {
      return { online: false, error: err.message };
    }
  } else {
    try {
      await axios.get(host, { timeout: 5000 });
      return { online: true, latency: Date.now() - startTime };
    } catch (err: any) {
      // For CORS blocked endpoints, if we get a network error but status is undefined, it could be online but blocked.
      // But if we can fetch, it is online.
      const isNetworkError = err.message === "Network Error" || err.code === "ERR_NETWORK";
      return { 
        online: isNetworkError, // often means it's online but CORS-blocked 
        latency: Date.now() - startTime,
        error: isNetworkError ? "Reachable (CORS restrictions apply)" : err.message
      };
    }
  }
}
