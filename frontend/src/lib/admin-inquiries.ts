export const INQUIRY_STATUSES = ["new", "contacted", "closed"] as const;
export type InquiryStatus = (typeof INQUIRY_STATUSES)[number];

export function isInquiryStatus(v: unknown): v is InquiryStatus {
  return typeof v === "string" && (INQUIRY_STATUSES as readonly string[]).includes(v);
}

export const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: "신규",
  contacted: "응대 중",
  closed: "완료",
};
