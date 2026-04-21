interface BookingData {
  fromAddress?: string;
  toAddress?: string;
  fromLocation?: { lat: number; lng: number; address?: string } | null;
  toLocation?: { lat: number; lng: number; address?: string } | null;
  date?: string;
  time?: string;
  passengerType?: string;
  equipment?: string[];
  distance?: number;
  fare?: number;
}

let pendingBooking: BookingData = {};

export const setPendingBooking = (data: Partial<BookingData>) => {
  pendingBooking = { ...pendingBooking, ...data };
};

export const getPendingBooking = (): BookingData => {
  return pendingBooking;
};

export const clearPendingBooking = () => {
  pendingBooking = {};
};
