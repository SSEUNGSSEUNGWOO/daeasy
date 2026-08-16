"use client";

import { useEffect, useState } from "react";

type Props = {
  words: string[];
  /** 한 글자 찍는 간격 */
  typeMs?: number;
  /** 한 글자 지우는 간격 (찍는 것보다 빨라야 자연스럽다) */
  deleteMs?: number;
  /** 단어를 다 쓴 뒤 머무는 시간 */
  holdMs?: number;
  /** 다 지운 뒤 다음 단어까지의 공백 */
  gapMs?: number;
};

export function HeroRotatingWord({
  words,
  typeMs = 90,
  deleteMs = 45,
  holdMs = 1600,
  gapMs = 300,
}: Props) {
  const [index, setIndex] = useState(0);
  // SSR 은 첫 단어를 완성형으로 렌더한다 — 문구가 잘린 채 인덱싱되지 않도록.
  const [count, setCount] = useState(() => words[0]?.length ?? 0);
  const [deleting, setDeleting] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const word = words[index] ?? "";

  useEffect(() => {
    if (reduced || words.length <= 1) return;

    // 다음 전이까지의 대기. 글자 경계에서는 타/삭 간격, 단어 경계에서는 정지 시간.
    const delay = deleting
      ? count > 0
        ? deleteMs
        : gapMs
      : count < word.length
        ? typeMs
        : holdMs;

    const id = setTimeout(() => {
      if (deleting) {
        if (count > 0) {
          setCount(count - 1);
        } else {
          setDeleting(false);
          setIndex((i) => (i + 1) % words.length);
        }
      } else if (count < word.length) {
        setCount(count + 1);
      } else {
        setDeleting(true);
      }
    }, delay);

    return () => clearTimeout(id);
    // word 는 문자열이라 값으로 안정적이다. words 배열 자체를 넣으면
    // 호출부의 인라인 리터럴 때문에 매 렌더 재실행된다.
  }, [word, words.length, count, deleting, reduced, typeMs, deleteMs, holdMs, gapMs]);

  // 가장 긴 단어로 외곽 width를 고정해 H1 줄바꿈 위치 흔들림 방지.
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), "");
  const typed = reduced ? word : word.slice(0, count);

  return (
    <span className="relative inline-block align-baseline">
      <span aria-hidden className="invisible whitespace-nowrap">
        {longest}
      </span>
      {/* 스크린리더에는 한 글자씩 읽히는 대신 완성된 문구 하나만 전달한다. */}
      <span className="sr-only">{words[0]}</span>
      <span
        aria-hidden
        className="absolute left-0 top-0 inline-block whitespace-nowrap"
      >
        <span className="relative inline-block">
          <span className="relative z-[1]">{typed}</span>
          <span className="absolute inset-x-[-2px] bottom-[6px] -z-0 h-[14px] bg-accent/30" />
        </span>
        {!reduced && (
          <span className="hero-caret ml-[3px] inline-block h-[0.78em] w-[3px] translate-y-[0.04em] bg-accent align-baseline" />
        )}
      </span>
    </span>
  );
}
