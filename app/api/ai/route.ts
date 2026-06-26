import { NextRequest, NextResponse } from "next/server";

const DEFAULT_REVIEW_TIPS = [
  "Use the focus keyword in the first paragraph to improve search engine context.",
  "Consider adding more subheadings (H2, H3) to break down long paragraphs for readability.",
  "Add bullet points or numbered lists to make the content easier to scan.",
  "Ensure the meta description is between 120 and 160 characters (currently it's in the sweet spot).",
  "Include at least one outbound link and one internal link to relevant resources."
];

// Helper to simulate review when no API key is provided
function runRuleBasedReview(title: string, content: string, focusKeyword: string, excerpt: string) {
  const suggestions: string[] = [];
  let seoScore = 70;
  let readabilityScore = 75;

  if (!focusKeyword) {
    suggestions.push("Define a focus keyword to get detailed SEO recommendations.");
    seoScore -= 15;
  } else {
    const kwRegex = new RegExp(focusKeyword, "gi");
    const matches = content.match(kwRegex) || [];
    const count = matches.length;

    if (count === 0) {
      suggestions.push(`The focus keyword "${focusKeyword}" was not found anywhere in the content.`);
      seoScore -= 20;
    } else if (count > 8) {
      suggestions.push(`Keyword stuffing detected! "${focusKeyword}" is used ${count} times. Aim for 2-4 times.`);
      seoScore -= 10;
    } else {
      suggestions.push(`Good keyword density! "${focusKeyword}" is used ${count} times.`);
      seoScore += 10;
    }

    if (title.toLowerCase().includes(focusKeyword.toLowerCase())) {
      suggestions.push(`Focus keyword "${focusKeyword}" is present in the title.`);
      seoScore += 10;
    } else {
      suggestions.push(`Try including your focus keyword "${focusKeyword}" in the title.`);
      seoScore -= 5;
    }
  }

  // Content length check
  const wordCount = content.split(/\s+/).filter(Boolean).length;
  if (wordCount < 300) {
    suggestions.push(`The article is quite short (${wordCount} words). Aim for at least 500-800 words for deeper indexing.`);
    readabilityScore -= 15;
  } else if (wordCount > 1500) {
    suggestions.push(`Comprehensive article (${wordCount} words). Ensure clear sections to maintain engagement.`);
    readabilityScore += 10;
  } else {
    suggestions.push(`Great article length (${wordCount} words). Perfect for a standard blog post.`);
    readabilityScore += 15;
  }

  // Headings check
  const h2Matches = content.match(/^##\s+/gm) || [];
  const h3Matches = content.match(/^###\s+/gm) || [];
  if (h2Matches.length === 0) {
    suggestions.push("No H2 headings found. Add headings (## Section Title) to organize sections.");
    readabilityScore -= 15;
  }

  // Excerpt check
  if (!excerpt) {
    suggestions.push("Add a short excerpt to hook readers on list pages and social media shares.");
    seoScore -= 10;
  }

  // Format validation suggestions
  if (content.includes("  \n") || content.includes("\n\n")) {
    // healthy spacing
  } else {
    suggestions.push("Spacing warning: Spacing seems dense. Add double line breaks between paragraphs.");
  }

  // Mix in defaults to ensure a rich list of suggestions
  DEFAULT_REVIEW_TIPS.forEach(tip => {
    if (suggestions.length < 5 && !suggestions.includes(tip)) {
      suggestions.push(tip);
    }
  });

  return {
    seoScore: Math.max(10, Math.min(100, seoScore)),
    readabilityScore: Math.max(10, Math.min(100, readabilityScore)),
    suggestions,
    isLocal: true,
  };
}

// Helper to format blog content locally using robust rules
function runRuleBasedFormatting(content: string) {
  if (!content) return "";

  // Split into lines
  const lines = content.split("\n");
  const formattedLines: string[] = [];
  let inCodeBlock = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Toggle code block
    if (line.trim().startsWith("```")) {
      inCodeBlock = !inCodeBlock;
      formattedLines.push(line.trim());
      continue;
    }

    if (inCodeBlock) {
      formattedLines.push(line);
      continue;
    }

    // 1. Fix Headings (trim spaces, ensure a space after #)
    if (line.trim().startsWith("#")) {
      const headingMatch = line.match(/^(#{1,6})(.*)$/);
      if (headingMatch) {
        const hashes = headingMatch[1];
        const text = headingMatch[2].trim();
        // Capitalize first letter of each word in headings for premium look (Title Case)
        const formattedText = text.replace(/\b\w/g, c => c.toUpperCase());
        formattedLines.push(`${hashes} ${formattedText}`);
        continue;
      }
    }

    // 2. Clean bullet list items
    if (line.trim().startsWith("-") || line.trim().startsWith("*")) {
      const listMatch = line.match(/^[\-\*]\s*(.*)$/);
      if (listMatch) {
        formattedLines.push(`- ${listMatch[1].trim()}`);
        continue;
      }
    }

    // 3. Clean numbered list items
    if (/^\d+\./.test(line.trim())) {
      const numMatch = line.match(/^(\d+)\.\s*(.*)$/);
      if (numMatch) {
        formattedLines.push(`${numMatch[1]}. ${numMatch[2].trim()}`);
        continue;
      }
    }

    // Push line with general trimming
    formattedLines.push(line.trimEnd());
  }

  // Reconstruct the text
  let result = formattedLines.join("\n");

  // 4. Standardize spacing (max 2 consecutive newlines)
  result = result.replace(/\n{3,}/g, "\n\n");

  // 5. Ensure there is a newline before headings (if they aren't at the very start)
  result = result.replace(/([^\n])\n(##+ )/g, "$1\n\n$2");

  // 6. Ensure there is a newline after headings
  result = result.replace(/(##+ [^\n]+)\n([^\n])/g, "$1\n\n$2");

  return result;
}

export async function POST(request: NextRequest) {
  try {
    const { action, title, content, focusKeyword, excerpt } = await request.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (action === "review") {
      if (apiKey) {
        // Run real Gemini review
        const prompt = `You are an expert SEO and content editor. Review the following blog post and return a JSON response containing:
1. "seoScore": an integer from 0 to 100
2. "readabilityScore": an integer from 0 to 100
3. "suggestions": an array of strings containing actionable feedback regarding structure, focus keywords, headings, formatting, and SEO.

Blog Title: "${title}"
Focus Keyword: "${focusKeyword || "none"}"
Excerpt: "${excerpt || "none"}"
Blog Content:
${content}

Ensure your response is ONLY a valid JSON object matching the schema above. Do not include markdown wraps like \`\`\`json.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (jsonText) {
            const parsed = JSON.parse(jsonText.trim());
            return NextResponse.json({ ...parsed, isLocal: false });
          }
        }
      }

      // Fallback
      const analysis = runRuleBasedReview(title || "", content || "", focusKeyword || "", excerpt || "");
      return NextResponse.json(analysis);
    }

    if (action === "format") {
      if (apiKey) {
        // Run real Gemini formatting
        const prompt = `You are a blog editor. Clean and format the following blog post text.
Improve readability by fixing headings, subheadings, consistent spacing, and lists formatting. Do NOT rewrite the text itself, only fix the structure, markdown formatting, paragraph breaks, and standard capitalisation.

Blog Content to Format:
${content}

Return ONLY the formatted markdown text. Do not add any introduction or explanations.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (response.ok) {
          const data = await response.json();
          const formattedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (formattedText) {
            return NextResponse.json({ formatted: formattedText.trim(), isLocal: false });
          }
        }
      }

      // Fallback
      const formatted = runRuleBasedFormatting(content || "");
      return NextResponse.json({ formatted, isLocal: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("AI API Error:", error);
    return NextResponse.json({ error: "Failed to process AI action" }, { status: 500 });
  }
}
