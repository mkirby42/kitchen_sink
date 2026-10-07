import type { ReactNode } from "react";

function cardCorner(tag: string | null): { icon: ReactNode; tone: string } {
  if (tag === "approach") {
    return { icon: "↑", tone: "bg-[#f3ddd3] text-clay" };
  }
  if (tag === "session_vibe") {
    return { icon: "◷", tone: "bg-[#dceee6] text-[#3f6d5c]" };
  }
  if (tag === "specialty") {
    return {
      icon: (
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <path d="M8 4.5h6.5L18 8v11.5H8A1.5 1.5 0 0 1 6.5 18V6A1.5 1.5 0 0 1 8 4.5Z" />
          <path d="M14.5 4.5V8H18" />
        </svg>
      ),
      tone: "bg-[#f6e4d8] text-clay",
    };
  }
  return { icon: "✦", tone: "bg-ink/10 text-ink" };
}

export function ConversationPeek({
  prompt,
  answer,
  tag,
}: {
  prompt: string;
  answer: string;
  tag: string | null;
}) {
  const corner = cardCorner(tag);
  return (
    <div className="relative mt-4 overflow-hidden rounded-box bg-cream pt-3.5 pr-5 pb-5 pl-5">
      <span
        className={`absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-br-2xl rounded-tl-box text-lg ${corner.tone}`}
        aria-hidden
      >
        {corner.icon}
      </span>
      <p className="pl-8 font-display text-[15px] text-clay italic">{prompt}</p>
      <p className="mt-2 text-[17px] leading-relaxed text-ink">{answer}</p>
    </div>
  );
}
