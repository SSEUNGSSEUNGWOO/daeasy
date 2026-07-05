"use client";

import { useState } from "react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  hint?: string;
};

export function ThumbnailPicker({ value, onChange, hint }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { detail?: string };
        throw new Error(body.detail ?? `업로드 실패 (${res.status})`);
      }
      const body = (await res.json()) as { url: string };
      onChange(body.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://... 또는 아래 버튼으로 업로드"
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-800 focus:border-[#0F0F0F] focus:outline-none"
      />
      <div className="flex items-center gap-3">
        <label className="cursor-pointer rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold hover:border-zinc-300 hover:text-[#0F0F0F]">
          {uploading ? "업로드 중..." : "이미지 업로드"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
              e.target.value = "";
            }}
          />
        </label>
        {hint && !error && <span className="text-xs text-zinc-500">{hint}</span>}
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>
      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value}
          alt="thumbnail preview"
          className="max-h-48 rounded-md border border-zinc-200 object-contain"
        />
      )}
    </div>
  );
}
