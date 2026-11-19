// Rules of the booking form, the same as the web's (helphive-web/src/pages/user/bookingForm.ts).
import dayjs, { type Dayjs } from "dayjs";

export const RATE_LIMITS = { min: 20, max: 200, step: 5, initial: 25 } as const;
export const HOUR_LIMITS = { min: 1, max: 12, initial: 4 } as const;

/** Common start times offered as tiles; "Other time" opens the system time picker. */
export const QUICK_TIMES = ["06:00", "07:00", "08:00", "09:00", "10:00", "12:00", "14:00"] as const;

export const FLOW_STEPS = [
	{ label: "Service" },
	{ label: "Date and time", short: "Date" },
	{ label: "Hours and rate", short: "Hours" },
	{ label: "Address" },
	{ label: "Payment" },
];

/** Today and the next six days, each at the start of the day. */
export const getDayOptions = (): Dayjs[] => Array.from({ length: 7 }, (_, i) => dayjs().startOf("day").add(i, "day"));

/** "HH:mm" as minutes after midnight. */
export const minutesOf = (label: string) => {
	const [h, m] = label.split(":").map(Number);
	return h * 60 + m;
};

/** Local start of the shift: the chosen day at the chosen minute of the day. */
export const combineStart = (day: Dayjs | null, minutes: number | null): Dayjs | null =>
	day && minutes !== null ? day.startOf("day").add(minutes, "minute") : null;

export interface FlowErrors {
	service?: string;
	date?: string;
	time?: string;
	address?: string;
}

/** Messages say how to fix the problem. */
export function validateFlow(v: {
	serviceId: number | null;
	day: Dayjs | null;
	minutes: number | null;
	address: string;
	pinned: boolean;
}): FlowErrors {
	const errors: FlowErrors = {};
	if (!v.serviceId) errors.service = "Choose a service to book.";
	if (!v.day) errors.date = "Choose the day of the shift.";
	if (v.minutes === null) errors.time = "Choose a start time.";
	const start = combineStart(v.day, v.minutes);
	if (start && start.isBefore(dayjs()))
		errors.time = "That start time has passed. Choose a later time or another day.";
	if (!v.pinned) errors.address = "Search for the place, or choose it on the map.";
	else if (!v.address.trim()) errors.address = "Type the address your provider should go to.";
	return errors;
}
