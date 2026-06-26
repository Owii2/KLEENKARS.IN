import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      status: "missing",
      message: "No Gemini API key was found configured in your .env configuration file."
    });
  }

  try {
    // Attempt a basic test query to Gemini v1beta API to verify status
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "ping" }] }]
      })
    });

    if (response.ok) {
      return NextResponse.json({
        status: "active",
        message: "Gemini Generative AI Engine is online and fully functional!"
      });
    } else {
      const errText = await response.text();
      let statusType = "suspended";
      let message = `API key rejected by Google: ${errText.substring(0, 150)}`;

      if (errText.includes("dunning") || response.status === 403) {
        statusType = "suspended";
        message = "GCP Billing Suspended: Google Cloud Platform has suspended generative AI billing on your key (Lightning dunning decision is deny). Please log into your Google Cloud console and update your payment method.";
      } else if (errText.includes("API_KEY_INVALID")) {
        statusType = "invalid";
        message = "Invalid API Key: The configured Gemini API key is incorrect or invalid. Please check your AI Studio console.";
      }

      return NextResponse.json({
        status: statusType,
        message: message,
        details: errText.substring(0, 300)
      });
    }
  } catch (error: any) {
    return NextResponse.json({
      status: "error",
      message: `Failed to communicate with Google API: ${error.message}`
    });
  }
}
