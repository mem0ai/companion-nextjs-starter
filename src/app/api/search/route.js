import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader) {
      console.error("Authorization header missing");
      return NextResponse.json(
        { error: "Authorization header missing" },
        { status: 401 }
      );
    }

    // Read the request body
    const body = await request.json();

    // Log the body for debugging
    console.log("Received Body in /api/search:", body);

    // Forward the request to the external API
    const response = await fetch("https://api.mem0.ai/v1/memories/search/", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Read the response from the external API
    const data = await response.json();

    // Handle errors from the external API
    if (!response.ok) {
      console.error("External API Error:", data);
      return NextResponse.json(data, { status: response.status });
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
