"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/Card";
import { NoJsAudio } from "@/components/ui/NoJsMedia";
import { voiceWaveform } from "@/lib/join/voice";

export function VoicePromptCard({
  prompt,
  src,
  name,
}: {
  prompt: string;
  src: string;
  name: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [armed, setArmed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const bars = voiceWaveform(prompt);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (!armed) {
      setArmed(true);
      audio.src = src;
      void audio.play().catch(() => setPlaying(false));
      return;
    }
    if (audio.paused) void audio.play().catch(() => setPlaying(false));
    else audio.pause();
  }

  const played = playing || progress > 0 ? progress : 0;

  return (
    <Card data-voice-prompt className="px-5 py-5">
      <p className="text-base leading-snug font-medium text-black">{prompt}</p>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          aria-label={
            playing ? `Pause voice prompt for ${name}` : `Play voice prompt for ${name}`
          }
          className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-paper hover:bg-ink-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {playing ? (
            <span className="size-3.5 rounded-[3px] bg-paper" aria-hidden />
          ) : (
            <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-paper" aria-hidden>
              <path d="M8 5.5v13l11-6.5-11-6.5z" />
            </svg>
          )}
        </button>
        <div className="flex h-10 min-w-0 flex-1 items-center gap-[2px]" aria-hidden>
          {bars.map((height, index) => {
            const heard = index / bars.length < played;
            return (
              <span
                key={index}
                className={heard ? "w-[3px] rounded-full bg-ink" : "w-[3px] rounded-full bg-ink/80"}
                style={{ height: `${Math.round(height * 100)}%` }}
              />
            );
          })}
        </div>
      </div>
      <NoJsAudio src={src} label={`Voice prompt for ${name}`} />
      <audio
        ref={audioRef}
        preload="none"
        playsInline
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(1);
        }}
        onTimeUpdate={() => {
          const audio = audioRef.current;
          if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
          setProgress(audio.currentTime / audio.duration);
        }}
      />
    </Card>
  );
}
