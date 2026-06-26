import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const STANDARD_INTERVIEW_QUESTIONS = [
  "What is the exact doorstep wash coverage area in Aligarh? Do you charge extra for distant locations?",
  "What premium car wax, polish, or ceramic coating brands does Kleenkars use?",
  "What is the policy for cancellation or rescheduling of a wash booking?",
  "Do you offer franchise partnerships? If so, what are the requirements or contact details?",
  "Is there a guarantee or warranty on detailing packages like Ceramic Coating?",
  "Do you offer special discounts or corporate wash rates for fleets or multiple cars?"
];

export async function POST(request: NextRequest) {
  try {
    const { action, question, answer } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (action === "generate-question") {
      if (apiKey) {
        // Fetch current knowledge
        const knowledge = await prisma.chatBotKnowledge.findMany();
        const knowledgeList = knowledge.map(k => k.question).join(", ");

        const prompt = `You are the lead developer training a Kleenkars Car Wash Customer Care Chatbot.
Based on the list of topics the chatbot already knows: [${knowledgeList}].
Generate ONE specific, highly relevant interview question about Kleenkars operations, wash guarantees, services, wax brands, or customer policies that the chatbot should ask the business admin to improve its support capabilities.
Do NOT repeat questions about timing, basic location, or standard bookings.
Make it sound like an AI assistant interviewing the admin (e.g., "What specific products or brands do you use for interior deep cleaning?").
Return ONLY the question text. Do not include any JSON wrapping or markdown.`;

        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });

          if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              return NextResponse.json({ question: text.trim() });
            }
          }
        } catch (err) {
          console.error("Gemini interview generation error:", err);
        }
      }

      // Fallback: pick a random standard question that isn't already answered
      const knowledge = await prisma.chatBotKnowledge.findMany();
      const existingQuestions = knowledge.map(k => k.question.toLowerCase());
      
      const unanswered = STANDARD_INTERVIEW_QUESTIONS.filter(q => 
        !existingQuestions.some(eq => eq.includes(q.substring(0, 15).toLowerCase()))
      );

      const chosenQuestion = unanswered.length > 0 
        ? unanswered[Math.floor(Math.random() * unanswered.length)]
        : "What premium polish or finish detailing brands does Kleenkars use to achieve showroom shine?";

      return NextResponse.json({ question: chosenQuestion });
    }

    if (action === "save-answer") {
      if (!question || !answer) {
        return NextResponse.json({ error: "Question and answer are required" }, { status: 400 });
      }

      // Save to knowledge base
      const entry = await prisma.chatBotKnowledge.create({
        data: {
          question: question.trim(),
          answer: answer.trim()
        }
      });

      return NextResponse.json({ success: true, entry });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Interview API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
