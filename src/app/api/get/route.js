// app/api/get/route.js
import { NextResponse } from "next/server";

export async function GET(request) {
  console.log("entering GET");
  try {
    const authHeader = request.headers.get("authorization");

    console.log("authHeader", authHeader);

    if (!authHeader) {
      console.error("Authorization header missing");
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");
    const agentId = searchParams.get("agent_id");
    const outputFormat = searchParams.get("output_format");

    if (!userId && !agentId) {
      return NextResponse.json(
        { error: "Either user_id or agent_id is required" },
        { status: 400 }
      );
    }

    const isAgent = Boolean(agentId);
    const entityId = isAgent ? agentId : userId;

    // Construct the URL with query parameters
    const apiUrl = new URL("https://api.mem0.ai/v1/memories/");
    apiUrl.searchParams.append(isAgent ? "agent_id" : "user_id", entityId);
    if (outputFormat) {
      apiUrl.searchParams.append("output_format", outputFormat);
    }

    // Log the external API URL for debugging
    console.log("External API URL:", apiUrl.toString());

    // Forward the request to the external API
    const response = await fetch(apiUrl.toString(), {
      method: "GET",
      headers: {
        Authorization: authHeader,
      },
    });

    // Read the response from the external API
    const data = await response.json();
    console.log("data", data);

    // Handle errors from the external API
    if (!response.ok) {
      console.error("External API Error:", data);
      return NextResponse.json(data, { status: response.status });
    } else {
      console.log("Response is ok");
    }

    // Return the data from the external API
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
