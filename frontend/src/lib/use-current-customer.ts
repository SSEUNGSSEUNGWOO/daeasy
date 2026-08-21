"use client";

import { useEffect, useState } from "react";

export type CurrentCustomer = {
  name: string;
  email: string;
  phone: string;
  organization: string;
};

/**
 * 문의 폼을 미리 채우기 위해 로그인 회원 정보를 가져온다.
 *
 * page(server component)에서 읽지 않는 이유: /rentals 가 revalidate=60 ISR 이라
 * 서버에서 쿠키를 읽는 순간 예약 현황 캐시가 통째로 깨진다.
 */
export function useCurrentCustomer() {
  const [customer, setCustomer] = useState<CurrentCustomer | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((res) => res.json() as Promise<{ customer: CurrentCustomer | null }>)
      .then((body) => {
        if (active) setCustomer(body.customer ?? null);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  return customer;
}
