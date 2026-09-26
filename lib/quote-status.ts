import type { QuoteStatus } from "@/generated/prisma/client";

export const STATUS_COLUMNS: { status: QuoteStatus; label: string }[] = [
  { status: "NEW", label: "New Requests" },
  { status: "WAITLISTED", label: "Waitlist" },
  { status: "ACCEPTED", label: "Accepted — Awaiting Client" },
  { status: "CONFIRMED", label: "Confirmed" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "FINISHED", label: "Finished" },
  { status: "REJECTED", label: "Rejected" },
];

export function isEmailPending(quote: {
  status: QuoteStatus;
  rejectionEmailSentAt: Date | null;
  confirmationSentAt: Date | null;
}) {
  if (quote.status === "REJECTED") return !quote.rejectionEmailSentAt;
  if (quote.status === "ACCEPTED") return !quote.confirmationSentAt;
  return false;
}

export const PRODUCTION_STAGE_LABELS: Record<string, string> = {
  NOT_STARTED: "Not started",
  SHOOTING_SCHEDULED: "Shooting scheduled",
  SHOT: "Shot",
  EDITING: "Editing",
  EDITED: "Edited",
  DELIVERED: "Delivered",
};