"use client";

import { useEffect, useState } from "react";

type Props = {
  words: string[];
  intervalMs?: number;
};

export function HeroRotatingWord({ words, intervalMs = 2600 }: Props) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (words.length <= 1) return;
    const id = setInterval(
      () => setIndex((i) => (i + 1) % words.length),
      intervalMs,
    );
    return () => clearInterval(id);
  }, [words.length, intervalMs]);

  // 가장 긴 단어로 외곽 width를 고정해 H1 줄바꿈 위치 흔들림 방지.
  // 띠는 안쪽 inline-block에 부착해 현재 단어 폭에 맞게 줄어듦.
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");

  return (
    <span className="relative inline-block align-baseline">
      <span aria-hidden className="invisible whitespace-nowrap">
        {longest}
      </span>
      <span
        key={index}
        className="hero-rotate-word absolute left-0 top-0 inline-block whitespace-nowrap"
      >
        <span className="relative z-[1]">{words[index]}</span>
        <span
          aria-hidden
          className="absolute inset-x-[-2px] bottom-[6px] -z-0 h-[14px] bg-accent/30"
        />
      </span>
    </span>
  );
}
