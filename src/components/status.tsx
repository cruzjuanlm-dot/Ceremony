import type { BookingStage, ClientStatus, DocumentStatus, RsvpStatus } from "~/data/types";
import type { PaymentState } from "~/lib/finance";
import {
  CLIENT_STATUS_LABEL,
  DOC_STATUS_LABEL,
  PHASE_LABEL,
  STAGE_LABEL,
  type WeddingPhase,
} from "~/lib/wedding";

import { Chip, type Tone } from "./kit";

/** Every status chip in the app, in one file, so a state always has the same colour. */

const PHASE_TONE: Record<WeddingPhase, Tone> = {
  undated: "muted",
  planning: "muted",
  final_details: "info",
  wedding_week: "warn",
  today: "brand",
  married: "good",
};
export const PhaseChip = ({ phase }: { phase: WeddingPhase }) => (
  <Chip tone={PHASE_TONE[phase]}>{PHASE_LABEL[phase]}</Chip>
);

const STAGE_TONE: Record<BookingStage, Tone> = {
  researching: "muted",
  contacted: "muted",
  quoted: "info",
  booked: "good",
  declined: "bad",
};
export const StageChip = ({ stage }: { stage: BookingStage }) => (
  <Chip tone={STAGE_TONE[stage]}>{STAGE_LABEL[stage]}</Chip>
);

const CLIENT_TONE: Record<ClientStatus, Tone> = {
  inquiry: "warn",
  proposal: "info",
  booked: "good",
  completed: "muted",
  lost: "bad",
};
export const ClientStatusChip = ({ status }: { status: ClientStatus }) => (
  <Chip tone={CLIENT_TONE[status]}>{CLIENT_STATUS_LABEL[status]}</Chip>
);

const PAY_TONE: Record<PaymentState, Tone> = { paid: "good", overdue: "bad", due_soon: "warn", scheduled: "muted" };
const PAY_LABEL: Record<PaymentState, string> = { paid: "Paid", overdue: "Overdue", due_soon: "Due soon", scheduled: "Scheduled" };
export const PaymentChip = ({ state }: { state: PaymentState }) => (
  <Chip tone={PAY_TONE[state]}>{PAY_LABEL[state]}</Chip>
);

const RSVP_TONE: Record<RsvpStatus, Tone> = { attending: "good", declined: "bad", pending: "warn" };
const RSVP_LABEL: Record<RsvpStatus, string> = { attending: "Attending", declined: "Declined", pending: "Awaiting reply" };
export const RsvpChip = ({ rsvp }: { rsvp: RsvpStatus }) => <Chip tone={RSVP_TONE[rsvp]}>{RSVP_LABEL[rsvp]}</Chip>;

const DOC_TONE: Record<DocumentStatus, Tone> = {
  draft: "muted",
  sent: "info",
  signed: "good",
  paid: "good",
  expired: "bad",
  filed: "good",
};
export const DocStatusChip = ({ status }: { status: DocumentStatus }) => (
  <Chip tone={DOC_TONE[status]}>{DOC_STATUS_LABEL[status]}</Chip>
);
