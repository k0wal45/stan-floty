export type RentalStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type PaymentMethod = "CASH" | "CARD" | "BLIK" | "TRANSFER";
export type PaymentStatus = "PAID" | "PARTIALLY_PAID" | "UNPAID";

export const RENTAL_STATUS_LABELS: Record<
  RentalStatus,
  { label: string; variant: "success" | "default" | "destructive" }
> = {
  ACTIVE: { label: "Aktywne", variant: "success" },
  COMPLETED: { label: "Zakończone", variant: "default" },
  CANCELLED: { label: "Anulowane", variant: "destructive" },
};

export const PAYMENT_STATUS_LABELS: Record<
  PaymentStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  PAID: { label: "Opłacone", variant: "success" },
  PARTIALLY_PAID: { label: "Częściowo opłacone", variant: "warning" },
  UNPAID: { label: "Nieopłacone", variant: "destructive" },
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: "Gotówka",
  CARD: "Karta",
  BLIK: "BLIK",
  TRANSFER: "Przelew",
};

export const PAYMENT_METHOD_OPTIONS: {
  value: PaymentMethod;
  label: string;
}[] = [
  { value: "CASH", label: "Gotówka" },
  { value: "CARD", label: "Karta" },
  { value: "BLIK", label: "BLIK" },
  { value: "TRANSFER", label: "Przelew" },
];

export interface RentalAttachment {
  url: string;
  name: string;
  uploadedAt: string;
}

export interface RentalRow {
  id: string;
  tenantId: string;
  itemId: string;
  customerName: string;
  customerPhone: string;
  customerIdentifier: string;
  startDate: Date;
  endDate: Date;
  initialEndDate: Date;
  rateSnapshot: number;
  rateUnitSnapshot: "HOUR" | "DAY" | "WEEK" | "MONTH";
  totalPrice: number;
  status: RentalStatus;
  attachments: RentalAttachment[] | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RentalWithPaymentInfo extends RentalRow {
  totalPaid: number;
  paymentStatus: PaymentStatus;
  itemName: string;
  itemIdentifier: string;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: Date;
}
