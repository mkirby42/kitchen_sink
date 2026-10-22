import type { ConsultBookAction, ContactAction } from "@/lib/therapists/load";

/**
 * Booking pair for one phone slide. Null when that profile did not load.
 * The stack pins this for the active therapist only.
 */
export type PhoneStackBooking = {
  id: string;
  givenName: string;
  actions: ConsultBookAction[];
  contact: ContactAction[];
} | null;
