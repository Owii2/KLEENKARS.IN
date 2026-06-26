import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

// Helper to normalize strings for comparison (lowercasing, cleaning punctuation)
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // remove punctuation except hyphens/spaces
    .replace(/\s+/g, " ")
    .trim();
}

// Offline fallback responder using local database knowledge base
async function runOfflineFallback(userMessage: string, knowledgeBase: any[], services: any[], offers: any[]) {
  const messageNorm = normalizeText(userMessage);
  const messageLower = userMessage.toLowerCase();

  // 0. Conversational / Greeting / Identity matching checks
  const words = messageNorm.split(" ");
  const greetings = ["hi", "hello", "hey", "greetings", "yo", "hola"];
  const thanks = ["thanks", "thank you", "ty", "appreciate"];
  const confirmations = ["ok", "okay", "fine", "perfect", "awesome", "great", "cool"];

  // Greeting Match (Checking if query is a simple greeting)
  if (greetings.some(g => words.includes(g)) || messageLower === "hi" || messageLower === "hello") {
    return "Hello! Welcome to Kleenkars Support. I can help you with wash packages, pricing details, active coupon offers, and general guidelines. How can I assist you today?";
  }

  // Capability / Help Check
  if (
    messageLower.includes("who are you") ||
    messageLower.includes("what is this") ||
    messageLower.includes("what do you do") ||
    messageLower.includes("what can you do") ||
    messageLower.includes("how can you help") ||
    messageLower.includes("capabilities") ||
    messageLower.includes("bot") ||
    messageLower.includes("ai") ||
    messageLower.includes("help me")
  ) {
    return "I am the Kleenkars AI Support Agent. You can ask me questions about our car wash packages (like Express Wash, Premium Wash, Rainy Day Shine), pricing, opening hours, current discounts, or booking procedures. How can I help you today?";
  }

  // Thanks Match
  if (thanks.some(t => messageLower.includes(t))) {
    return "You're very welcome! If you have any more questions or want to schedule a wash, feel free to ask. Have a wonderful day!";
  }

  // Booking Intent Match
  const bookingKeywords = ["book", "booking", "schedule", "reserve", "appointment", "how to book", "how do i book"];
  const positiveConfirms = ["yes", "yeah", "yep", "sure", "please"];
  const wordsLower = words.map(w => w.toLowerCase());

  if (
    bookingKeywords.some(kw => messageLower.includes(kw)) ||
    (positiveConfirms.some(pc => wordsLower.includes(pc)) && words.length <= 4)
  ) {
    return "Great! You can book your service directly online by going to our **[Booking Page](/booking)**. Simply choose your wash package, select your vehicle, choose a date & time, and confirm. Let me know if you need help choosing a package!";
  }

  // Confirmation/Closing Match
  if (confirmations.some(c => words.includes(c)) && words.length <= 2) {
    return "Great! Let me know if there's anything else you need. You can book a wash anytime using the 'Book Now' button on our homepage!";
  }

  // Helper to extract a group name from service names
  // e.g. "Express Wash - Bike" -> "Express Wash"
  // e.g. "Vacuum (Addon)" -> "Vacuum"
  const getServiceGroup = (name: string) => {
    const parts = name.split(/ - | \(/);
    return parts[0].trim();
  };

  // Group services dynamically
  const groupedServices: Record<string, any[]> = {};
  for (const s of services) {
    const grp = getServiceGroup(s.name);
    if (!groupedServices[grp]) {
      groupedServices[grp] = [];
    }
    groupedServices[grp].push(s);
  }

  // Keywords mapping for service groups to assist token-based lookups
  const groupKeywords: Record<string, string[]> = {
    "Express Wash": ["express", "quick wash", "basic wash"],
    "Classic Wash": ["classic", "standard wash"],
    "Premium Wash": ["premium", "deep clean", "full wash", "interior exterior"],
    "Rainy Day Shine": ["rainy", "rain", "monsoon", "weather"],
    "Cabin Revive": ["cabin", "revive", "interior", "seats", "carpet", "vacuuming"],
    "Paint Restoration": ["paint", "restoration", "scratch", "rubbing", "polish", "waxing"],
    "Vacuum": ["vacuum", "vaccum"],
    "Tyre Shine": ["tyre", "tire", "wheel"],
    "Dashboard Polish": ["dashboard", "dash"],
    "Body Wax": ["wax", "body wax"],
    "Perfume Sticker": ["perfume", "fragrance", "scent", "sticker"],
  };

  // 1. Specific Service or Service Group Matching
  // First, check if the query matches a specific service group
  let matchedGroup: string | null = null;
  for (const [groupName, keywords] of Object.entries(groupKeywords)) {
    const groupLower = groupName.toLowerCase();
    
    // Direct phrase match or key term match
    if (
      messageNorm.includes(groupLower) ||
      keywords.some(kw => {
        const kwLower = kw.toLowerCase();
        // Check word boundary/whole word match
        const regex = new RegExp(`\\b${kwLower}\\b`, "i");
        return regex.test(messageNorm);
      })
    ) {
      matchedGroup = groupName;
      break;
    }
  }

  if (matchedGroup && groupedServices[matchedGroup]) {
    const matches = groupedServices[matchedGroup];
    const matchesStr = matches
      .map(s => `- **${s.name}**: ₹${s.price}${s.description ? ` (${s.description})` : ""}`)
      .join("\n");
    return `For **${matchedGroup}**, we offer the following packages:\n${matchesStr}\n\nWould you like to book one of these packages online?`;
  }

  // Also check if they mentioned an exact service name
  for (const s of services) {
    const sNameNorm = normalizeText(s.name);
    if (messageNorm.includes(sNameNorm)) {
      return `The price for our "${s.name}" is ₹${s.price}. ${s.description || "It delivers a premium clean and care for your vehicle."}`;
    }
  }

  // 2. Smart FAQ Matching (with enhanced word stemming/substring checking)
  const stopWords = new Set(["what", "is", "the", "of", "for", "to", "a", "in", "about", "how", "can", "do", "you", "our", "my", "your", "are", "we", "do", "does", "any"]);
  let bestMatch = null;
  let maxScore = 0;

  for (const entry of knowledgeBase) {
    const questionLower = entry.question.toLowerCase();
    
    // Direct substring checks
    if (messageLower.includes(questionLower) || questionLower.includes(messageLower)) {
      return entry.answer;
    }

    // Token overlap comparison (with smart substring/stemming matching)
    const qWords = questionLower.split(/\s+/).map((w: string) => w.replace(/[^\w]/g, "")).filter((w: string) => w.length > 2 && !stopWords.has(w));
    const mWords = messageLower.split(/\s+/).map((w: string) => w.replace(/[^\w]/g, "")).filter((w: string) => w.length > 2 && !stopWords.has(w));
    
    let matchedWords = 0;
    for (const qw of qWords) {
      // Check if any word in user query is related to standard word
      if (mWords.some((mw: string) => mw.includes(qw) || qw.includes(mw))) {
        matchedWords++;
      }
    }

    if (qWords.length > 0) {
      const score = matchedWords / qWords.length;
      if (score > maxScore && score >= 0.4) { // require at least 40% matching words
        maxScore = score;
        bestMatch = entry;
      }
    }
  }

  if (bestMatch) {
    return bestMatch.answer;
  }

  // 3. Direct Offers Match (Coupon/Discount query)
  // Check for discount keywords, but make sure they are not just standard "do you offer" questions
  const cleanMessageForOfferCheck = messageLower.replace(/\bdo you offer\b/g, "").replace(/\bwhat do you offer\b/g, "");
  if (
    cleanMessageForOfferCheck.includes("discount") ||
    cleanMessageForOfferCheck.includes("coupon") ||
    cleanMessageForOfferCheck.includes("promo") ||
    cleanMessageForOfferCheck.includes("code") ||
    cleanMessageForOfferCheck.includes("deal") ||
    /\boffers?\b/.test(cleanMessageForOfferCheck)
  ) {
    if (offers.length > 0) {
      const offersList = offers
        .map(o => {
          const discountStr = o.discountPercent ? `${o.discountPercent}%` : `₹${o.discountAmount}`;
          return `- **Code "${o.code}"** (${o.description || "Active Offer"}): Get ${discountStr} off your service!`;
        })
        .join("\n");
      return `Here are our current active offers:\n${offersList}\n\nYou can enter the coupon code when booking your service!`;
    }
  }

  // 4. General Pricing / Packages / Complete List Request
  if (
    messageLower.includes("price") ||
    messageLower.includes("pricing") ||
    messageLower.includes("cost") ||
    messageLower.includes("rate") ||
    messageLower.includes("charge") ||
    messageLower.includes("package") ||
    messageLower.includes("list") ||
    messageLower.includes("how much")
  ) {
    if (services.length > 0) {
      const minPrice = Math.min(...services.map(s => s.price));
      let response = `Our professional car wash services start at just **₹${minPrice}**. Here is our complete price list by category:\n\n`;
      
      for (const [groupName, groupServices] of Object.entries(groupedServices)) {
        response += `**${groupName}**:\n`;
        for (const s of groupServices) {
          response += `- ${s.name}: ₹${s.price}\n`;
        }
        response += "\n";
      }
      
      response += "You can book any of these packages directly online! If you need help choosing, please call us at 8650007661.";
      return response;
    }
    return "Our services start at just ₹49 for bikes and ₹149 for standard car washes. You can view all detailing packages and book directly via the 'Book Now' page on our homepage!";
  }

  // 5. Fallback Keyword rules
  if (messageLower.includes("timing") || messageLower.includes("hour") || messageLower.includes("open") || messageLower.includes("close")) {
    return "Kleenkars is open daily from 10:00 AM to 10:00 PM. Would you like to schedule a wash booking?";
  }
  if (messageLower.includes("location") || messageLower.includes("where") || messageLower.includes("address") || messageLower.includes("find")) {
    return "We are located at Mustafa Market, Anoop Shahar Rd, Aligarh. We also offer doorstep pickup and drop-off services for your convenience!";
  }
  if (messageLower.includes("contact") || messageLower.includes("phone") || messageLower.includes("call") || messageLower.includes("mobile") || messageLower.includes("help") || messageLower.includes("support")) {
    return "You can reach Kleenkars Support directly by calling 8650007661 or WhatsApp us at wa.me/+918650007661. We are happy to answer any of your queries!";
  }

  return "Thank you for contacting Kleenkars Support! I've recorded your query, and a customer representative will follow up with you shortly. You can also call us directly at 8650007661 or message us on WhatsApp at wa.me/+918650007661.";
}

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, name: suppliedName } = await request.json();
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. Resolve user token
    let customerId: string | null = null;
    let customerName = suppliedName || "Guest";
    let customerContext = "The user is browsing as a Guest.";

    const token = (await cookies()).get("token")?.value;
    if (token) {
      const payload = verifyToken(token) as { id?: string } | null;
      if (payload?.id) {
        const customer = await prisma.customer.findUnique({
          where: { id: payload.id },
          include: {
            Booking: {
              include: { service: true },
              orderBy: { createdAt: "desc" },
              take: 3,
            },
            vehicles: true,
          },
        });

        if (customer) {
          customerId = customer.id;
          customerName = customer.customerName;
          
          // Formulate rich context about user for AI
          const vehicleList = customer.vehicles.map(v => `${v.type} (${v.plateNumber})`).join(", ");
          const bookingsList = customer.Booking.map(b => `Booking ID ${b.id}: status is ${b.status}, service: ${b.service?.name || "Wash Package"}, date: ${b.bookingDate}`).join("; ");
          
          customerContext = `Authenticated Customer Profile:
Name: ${customerName}
Phone: ${customer.phoneNumber}
Vehicles: ${vehicleList || "None registered"}
Recent Booking History: ${bookingsList || "No prior bookings found"}`;
        }
      }
    }

    // 2. Resolve or Create Chat Session
    let session;
    if (sessionId) {
      session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: "asc" } } },
      });
    }

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          customerName: customerName,
          customerId: customerId,
        },
        include: { messages: true },
      });
    }

    // Save user message to database
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "user",
        text: message,
      },
    });

    // 3. Fetch Knowledge Base, Active Services, Live Offers & Recent History
    const [knowledgeBase, services, offers] = await Promise.all([
      prisma.chatBotKnowledge.findMany(),
      prisma.service.findMany({ where: { isActive: true } }),
      prisma.offer.findMany({ where: { isActive: true } }),
    ]);
    const recentMessages = session.messages.slice(-10); // Keep last 10 exchanges for context

    const servicesContext = services
      .map(s => `- ${s.name}: Price ₹${s.price} (Category: ${s.category || "General"}) - ${s.description || "No description available"}`)
      .join("\n");

    const offersContext = offers
      .map(o => `- Code: ${o.code || "N/A"} (${o.title}): ${o.description || ""} - Discount: ${o.discountPercent ? `${o.discountPercent}%` : `₹${o.discountAmount}`} off`)
      .join("\n");

    const knowledgeContext = knowledgeBase
      .map(k => `Q: ${k.question}\nA: ${k.answer}`)
      .join("\n\n");

    const chatHistoryContext = recentMessages
      .map(m => `${m.sender === "user" ? "Customer" : "Kleenkars Representative"}: ${m.text}`)
      .join("\n");

    // 4. Invoke AI Model (or fallback)
    const apiKey = process.env.GEMINI_API_KEY;
    let botReply = "";

    if (apiKey) {
      const prompt = `You are a polite, helpful, and professional customer care agent representing Kleenkars, a premium car wash and detailing company in Aligarh. Your goal is to answer queries and guide customers to make booking wash packages.

Kleenkars Live Services & Pricing:
${servicesContext || "No custom services listed yet."}

Active Offers & Promo Codes:
${offersContext || "No active promo offers at the moment."}

Kleenkars FAQ Details & Knowledge Base:
${knowledgeContext}

Customer Information:
${customerContext}

Chat History:
${chatHistoryContext}

Current Customer Message:
"${message}"

Instructions:
1. Always stay in character as a Kleenkars representative.
2. If the user is authenticated, address them by name and refer to their vehicles or bookings if helpful and relevant.
3. Use the live services, pricing, and active coupons context when answering questions about costs, washes, or active discounts.
4. Encourage them to book or contact support at 8650007661.
5. Be concise and professional. Keep the tone friendly and high-end.

Write the customer care reply:`;

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
          botReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        } else {
          const errText = await response.text();
          console.warn(`Gemini API call failed with status ${response.status}: ${errText}`);
        }
      } catch (err) {
        console.error("Gemini chatbot error:", err);
      }
    }

    // Run fallback if Gemini response is empty/failed
    if (!botReply) {
      botReply = await runOfflineFallback(message, knowledgeBase, services, offers);
    }

    // Save Bot message to database
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        sender: "bot",
        text: botReply.trim(),
      },
    });

    // Touch session to update updatedAt
    await prisma.chatSession.update({
      where: { id: session.id },
      data: { customerName }, // update name in case guest supplied name
    });

    return NextResponse.json({
      sessionId: session.id,
      reply: botReply.trim(),
      customerName,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
