"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, AlertCircle } from "lucide-react"; // 전송 및 경고 아이콘
import { motion, AnimatePresence } from "framer-motion"; // 애니메이션 효과

/**
 * 메시지 객체의 구조 정의
 * - id: 리스트 렌더링 시 고유 키값으로 사용
 * - role: 'user'(사용자) 또는 'assistant'(AI)
 * - content: 메시지 텍스트 내용
 */
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

// 고유 ID 생성을 위한 유틸리티 함수 (현재 시간 + 랜덤값)
const makeId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export default function ChatPage() {
  // --- 상태 관리 (State) ---
  const [messages, setMessages] = useState<Message[]>([
    { id: makeId(), role: "assistant", content: "안녕하세요! 무엇을 도와드릴까요?" },
  ]);
  const [input, setInput] = useState("");           // 입력창 텍스트
  const [isLoading, setIsLoading] = useState(false); // AI 답변 대기 상태
  const [error, setError] = useState<string | null>(null); // 에러 발생 시 안내 텍스트

  // --- 참조 관리 (Ref) ---
  const scrollRef = useRef<HTMLDivElement>(null);     // 채팅창 자동 스크롤용
  const textareaRef = useRef<HTMLTextAreaElement>(null); // 입력창 높이 조절 및 포커스용

  // --- 효과 (Effects) ---

  // 1. 자동 스크롤: 메시지가 늘어나거나 로딩 상태가 바뀔 때 화면을 가장 아래로 내림
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  // 2. 입력창 높이 자동 조절: 내용이 많아지면 입력창이 위로 늘어남
  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
  }, [input]);

  // --- 주요 기능 (Functions) ---

  /**
   * 메시지 전송 처리
   * 1. 사용자 메시지를 화면에 즉시 표시
   * 2. 서버 API에 메시지 전달 (최근 20개 대화만 맥락으로 전달)
   * 3. 서버 응답을 화면에 표시
   */
  const handleSend = async () => {
    if (!input.trim() || isLoading) return; // 비어있거나 로딩 중이면 차단

    const userMessage: Message = { id: makeId(), role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];

    // UI 상태 업데이트
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);
    setError(null);

    // 전송 후 바로 다시 입력할 수 있도록 입력창에 포커스 유지
    textareaRef.current?.focus();

    try {
      // ✅ 최적화: 대화가 너무 길어지면 토큰 소모가 크므로 최근 20개만 API로 보냄
      const payloadMessages = newMessages.slice(-20).map(({ role, content }) => ({ role, content }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages }),
      });

      const data = await response.json();

      // 응답 상태 및 데이터 검증
      if (!response.ok || data?.error) {
        throw new Error(data?.error || "서버 응답이 올바르지 않습니다.");
      }

      // ✅ 데이터 구조 안전성 체크
      if (!data?.role || !data?.content) {
        throw new Error("AI 응답 형식이 올바르지 않습니다.");
      }

      // 서버로부터 받은 AI 답변을 메시지 목록에 추가
      setMessages((prev) => [...prev, { id: makeId(), role: data.role, content: data.content }]);
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "요청 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false); // 로딩 종료
    }
  };

  /**
   * 키보드 이벤트 핸들러
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    // ✅ 중요: 한글 입력 시 Enter를 누르면 마지막 글자가 두 번 입력되는 버그 방지 (IME 조합 체크)
    if ((e.nativeEvent as any).isComposing) return;

    // Shift + Enter는 줄바꿈, 그냥 Enter는 메시지 전송
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main>
      {/* 상단 헤더 */}
      <header className="header">
        <h1>ChatGPT Mobile</h1>
      </header>

      {/* 채팅 목록 영역 */}
      <div className="chat-container" ref={scrollRef}>
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              // 나타날 때 부드러운 애니메이션 효과
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              // 발신자(사용자/AI)에 따라 다른 스타일 적용
              className={`message ${msg.role === "user" ? "user" : "ai"}`}
            >
              {msg.content}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* AI가 응답 중일 때 보여주는 로딩 표시 */}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="message ai typing-indicator">
            <div className="dot" />
            <div className="dot" />
            <div className="dot" />
          </motion.div>
        )}

        {/* 오류 발생 시 사용자에게 노출되는 빨간색 안내창 */}
        {error && (
          <div
            className="error-message"
            style={{
              color: "#ef4444",
              textAlign: "center",
              padding: "10px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>

      {/* 하단 입력바 영역 */}
      <div className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="메시지를 입력하세요..."
          />
        </div>

        {/* 전송 버튼 (빈 칸이거나 로딩 중이면 비활성화) */}
        <button className="send-button" onClick={handleSend} disabled={!input.trim() || isLoading}>
          <Send size={20} />
        </button>
      </div>
    </main>
  );
}
