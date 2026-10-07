import type { Booking, Payment, Vendor } from "~/data/types";
import { bookingBalance } from "~/lib/finance";

/**
 * Per-vendor rollups across weddings, built only from finance.ts's bookingBalance().
 * (Candidate for finance.ts if another screen needs it.)
 */
export function vendorStats(vendor: Vendor, bookings: Booking[], payments: Payment[]) {
  const own = bookings.filter((b) => b.vendorId === vendor.id);
  const booked = own.filter((b) => b.stage === "booked");
  let contracted = 0;
  let balance = 0;
  for (const b of booked) {
    const bal = bookingBalance(b, payments);
    contracted += bal.contracted;
    balance += bal.balance;
  }
  return { bookings: own, bookedCount: booked.length, contracted, balance, hasContract: booked.some((b) => b.amount != null) };
}

/** The earliest unpaid installment against a booking, if any. */
export function nextPayment(bookingId: string, payments: Payment[]): Payment | null {
  return (
    payments
      .filter((p) => p.bookingId === bookingId && !p.paidDate)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
  );
}

export function endOfMonthIso(isoDay: string): string {
  const [y, m] = isoDay.split("-").map(Number);
  const last = new Date(y, m, 0).getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}
