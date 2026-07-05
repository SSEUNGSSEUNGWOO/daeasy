"use client";

import "@uiw/react-md-editor/markdown-editor.css";

import dynamic from "next/dynamic";
import { useState } from "react";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

type Props = {
  value: string;
  onChange: (next: string) => void;
  height?: number;
  onImagePicked?: (url: string) => void;
};

export function MarkdownEditor({ value, onChange, height = 480, onImagePicked }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleImage(file: File) {
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
      onImagePicked?.(body.url);
      onChange(`${value}${value.endsWith("\n") || value.length === 0 ? "" : "\n"}\n![](${body.url})\n`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div data-color-mode="light" className="space-y-2">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        preview="live"
      />
      <div className="flex items-center gap-3 text-xs text-zinc-500">
        <label className="cursor-pointer rounded-md border border-zinc-200 px-3 py-1.5 font-semibold hover:border-zinc-300 hover:text-[#0F0F0F]">
          {uploading ? "업로드 중..." : "이미지 추가"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImage(f);
              e.target.value = "";
            }}
          />
        </label>
        {error && <span className="text-red-600">{error}</span>}
      </div>
    </div>
  );
}
