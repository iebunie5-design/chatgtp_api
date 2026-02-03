import { OpenAI } from "openai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1) API 키 확인을 먼저 (빈 문자열로 초기화하지 않기)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OpenAI API Key가 설정되지 않았습니다. .env.local을 확인해주세요." },
        { status: 500 }
      );
    }

    const openai = new OpenAI({ apiKey });

    // 2) 요청 파싱 + 검증
    const body = await req.json().catch(() => ({}));
    const messages = body?.messages;

    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { error: "요청 형식이 올바르지 않습니다. messages는 배열이어야 합니다." },
        { status: 400 }
      );
    }

    // 3) 메시지 형태 최소 검증 + 너무 긴 대화는 최근 N개로 제한(예: 20개)
    const trimmed = messages
      .filter((m: any) => m && typeof m.role === "string" && typeof m.content === "string")
      .slice(-20);

    if (trimmed.length === 0) {
      return NextResponse.json(
        { error: "messages가 비어있거나 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 4) OpenAI 호출
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "당신은 친절하고 도움이 되는 모바일 대화 비서입니다. 답변은 짧고 간결하며 명확하게 하세요.",
        },
        ...trimmed,
      ],
      temperature: 0.7,
      max_tokens: 300, // 모바일용 짧은 답변 유도(원하면 150~500 조절)
    });

    // 5) 안전한 응답 반환
    const msg = response.choices?.[0]?.message;
    if (!msg) {
      return NextResponse.json(
        { error: "AI 응답을 생성하지 못했습니다. 잠시 후 다시 시도해주세요." },
        { status: 502 }
      );
    }

    return NextResponse.json(msg);
  } catch (error: any) {
    console.error("Chat API Error:", error);

    // OpenAI SDK 에러 메시지가 길어질 수 있어 사용자 친화적으로 정리
    return NextResponse.json(
      { error: error?.message || "서버 응답 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
