import { NextRequest, NextResponse } from "next/server";

const MAX_MESSAGES = 24;
const MAX_CONTENT_CHARS = 12000;

type ChatRole = "user" | "assistant";

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey?.trim()) {
    return NextResponse.json({ error: "missing_key" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { messages, language, spotName } = body as {
    messages?: unknown;
    language?: unknown;
    spotName?: unknown;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "no_messages" }, { status: 400 });
  }

  const normalized: { role: ChatRole; content: string }[] = [];
  for (const entry of messages.slice(-MAX_MESSAGES)) {
    if (!entry || typeof entry !== "object") continue;
    const r = (entry as { role?: unknown }).role;
    const c = (entry as { content?: unknown }).content;
    const role: ChatRole = r === "assistant" ? "assistant" : "user";
    const content = typeof c === "string" ? c.slice(0, MAX_CONTENT_CHARS) : "";
    if (!content.trim()) continue;
    normalized.push({ role, content });
  }

  if (normalized.length === 0) {
    return NextResponse.json({ error: "no_messages" }, { status: 400 });
  }

  const lang =
    language === "en" ? "en" : language === "zh" ? "zh" : language === "ko" ? "ko" : "ja";
  const spotLine =
    typeof spotName === "string" && spotName.trim()
      ? `The user is browsing in context of spot: "${spotName.trim()}".`
      : "";

  const replyLanguage =
    lang === "ja"
      ? "Japanese"
      : lang === "en"
        ? "English"
        : lang === "zh"
          ? "Simplified Chinese"
          : "Korean";

  const system = `You are the in-app assistant for "Trad Trav", a travel app focused on traditional culture and experiences in Miyagi, Japan (also general Japan travel).
${spotLine}
Answer in ${replyLanguage}. Be concise, warm, and practical. Cover manners, trains, photos, shrines/temples, onsen, festivals, workshops, payments, and reservations when relevant.
If uncertain, suggest cautious behavior and asking local staff.
Use GitHub-flavored Markdown for readability: **bold** for important words, *italic* for light emphasis, and "-" bullet lines for lists. Avoid huge tables; short paragraphs are best.`;

  const model = process.env.OPENAI_CHAT_MODEL?.trim() || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: system }, ...normalized],
      temperature: 0.55,
      max_tokens: 900,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    console.error("[helpful-chat] OpenAI HTTP", res.status, errBody.slice(0, 500));
    return NextResponse.json({ error: "upstream", status: res.status }, { status: 502 });
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string | null } }[];
  };
  const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!reply) {
    return NextResponse.json({ error: "empty_reply" }, { status: 502 });
  }

  return NextResponse.json({ reply });
}
