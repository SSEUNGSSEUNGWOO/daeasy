export const CONTENT_STATUSES = ["draft", "published"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export function isContentStatus(v: unknown): v is ContentStatus {
  return typeof v === "string" && (CONTENT_STATUSES as readonly string[]).includes(v);
}

export const CONTENT_STATUS_LABEL: Record<ContentStatus, string> = {
  draft: "임시저장",
  published: "공개",
};

export const COURSE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type CourseLevelValue = (typeof COURSE_LEVELS)[number];

export const COURSE_LEVEL_LABEL: Record<CourseLevelValue, string> = {
  beginner: "입문",
  intermediate: "중급",
  advanced: "심화",
};

export function isCourseLevel(v: unknown): v is CourseLevelValue {
  return typeof v === "string" && (COURSE_LEVELS as readonly string[]).includes(v);
}
