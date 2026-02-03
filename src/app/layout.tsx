import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * [SEO 및 앱 설정]
 * 웹 페이지의 제목, 설명 및 모바일 앱(PWA) 관련 설정을 담고 있습니다.
 */
export const metadata: Metadata = {
  title: "AI Chat Mobile",
  description: "심플하고 직관적인 모바일 전용 ChatGPT 앱",
  // iOS 기기에서 "홈 화면에 추가"했을 때 앱처럼 보이게 하는 설정
  appleWebApp: {
    capable: true,                // 앱 모드 사용 가능 여부
    statusBarStyle: "default",   // 상단 상태바 스타일
    title: "AI Chat",            // 홈 화면 아이콘 이름
  },
};

/**
 * [화면 설정 (Viewport)]
 * 모바일 화면에서 앱이 어떻게 보일지 결정하는 중요한 설정입니다.
 */
export const viewport: Viewport = {
  width: "device-width",   // 기기의 실제 너비에 맞춤
  initialScale: 1,         // 초기 확대 비율
  maximumScale: 1,         // 최대 확대 비율 (1로 고정하여 자동 줌 방지)
  userScalable: false,     // 사용자가 손가락으로 확대/축소하는 것을 막음 (앱 같은 느낌을 주기 위함)
};

/**
 * [루트 레이아웃 컴포넌트]
 * 모든 페이지의 뼈대가 되는 기본 구조입니다.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 모바일 브라우저의 주소창 색상 등을 조절할 수 있습니다 (필요 시) */}
      </head>
      <body>
        {/* 모든 페이지의 내용(children)이 이곳에 렌더링됩니다. */}
        {children}
      </body>
    </html>
  );
}
