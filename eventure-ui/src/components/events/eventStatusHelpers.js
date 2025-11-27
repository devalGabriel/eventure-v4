// src/components/events/eventStatusHelpers.js

export const INVITATION_STATUS_COLOR_MAP = {
  PENDING: "warning",
  ACCEPTED: "success",
  DECLINED: "error",
  EXPIRED: "default",
  CANCELLED: "default",
};

export const OFFER_STATUS_COLOR_MAP = {
  DRAFT: "default",
  SENT: "info",
  REVISED: "info",
  ACCEPTED: "success",
  ACCEPTED_BY_CLIENT: "success",
  DECLINED: "error",
  REJECTED: "error",
  REJECTED_BY_CLIENT: "error",
  WITHDRAWN: "default",
  CANCELLED: "default",
};

export const ASSIGNMENT_STATUS_LABEL_MAP = {
  SHORTLISTED: "Shortlist",
  SELECTED: "Selectat",
  CONFIRMED_PRE_CONTRACT: "Pre-contract",
};

export function invitationStatusColor(status) {
  return INVITATION_STATUS_COLOR_MAP[status] || "default";
}

export function offerStatusColor(status) {
  return OFFER_STATUS_COLOR_MAP[status] || "default";
}

export function assignmentStatusLabel(status) {
  return ASSIGNMENT_STATUS_LABEL_MAP[status] || status;
}
