import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const { url, method, headers, body } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "Target URL is required" },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      const response = await axios({
        url,
        method: method || "POST",
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "User-Agent": "PostmanRuntime/7.39.0",
        },
        data: body,
        timeout: 15000, // 15s timeout
        validateStatus: () => true, // Don't throw error on non-2xx status code
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      return NextResponse.json({
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
        duration,
      });
    } catch (apiError: any) {
      const duration = Date.now() - startTime;
      return NextResponse.json(
        {
          success: false,
          error: apiError.message || "Failed to contact target server",
          details: apiError.response?.data || null,
          status: apiError.response?.status || 500,
          duration,
        },
        { status: 200 } // Return status 200 to UI so it can handle the error nicely
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
