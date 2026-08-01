import "server-only";

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { cache } from "react";

import { getSupabaseAdmin } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const ADMIN_ROLES = ["admin", "editor"] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
};

type ProfileRow = {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
};

export function isAdminRole(v: unknown): v is AdminRole {
  return typeof v === "string" && (ADMIN_ROLES as readonly string[]).includes(v);
}

/** 역할별 첫 화면. editor 는 문의 대시보드(/admin)를 볼 수 없다. */
export function homeFor(role: AdminRole): string {
  return role === "admin" ? "/admin" : "/admin/courses";
}

/**
 * 현재 요청의 사용자. 로그인 안 했거나 비활성 계정이면 null.
 *
 * getUser() 는 Supabase Auth 서버에 토큰을 검증시킨다.
 * getSession() 은 쿠키를 그대로 믿기 때문에 권한 판정에 쓰면 안 된다.
 * React cache 로 한 번의 렌더 안에서는 한 번만 조회한다.
 */
export const getCurrentUser = cache(async (): Promise<AdminUser | null> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: profile } = await getSupabaseAdmin()
    .from("profiles")
    .select("id,email,name,role,is_active")
    .eq("id", data.user.id)
    .maybeSingle<ProfileRow>();

  if (!profile || !profile.is_active) return null;
  if (!isAdminRole(profile.role)) return null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role,
  };
});

/** 페이지(서버 컴포넌트)용. 미로그인이면 로그인 화면으로 보낸다. */
export async function requireUser(): Promise<AdminUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** 페이지용. 역할이 다르면 그 사람의 첫 화면으로 돌려보낸다. */
export async function requireRole(role: AdminRole): Promise<AdminUser> {
  const user = await requireUser();
  if (user.role !== role) redirect(homeFor(user.role));
  return user;
}

/** Route Handler 용 응답. 페이지처럼 리다이렉트하지 않는다. */
export function unauthorized(): NextResponse {
  return NextResponse.json({ detail: "로그인이 필요합니다." }, { status: 401 });
}

export function forbidden(): NextResponse {
  return NextResponse.json({ detail: "권한이 없습니다." }, { status: 403 });
}
