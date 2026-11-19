import { useMemo, useState } from "react";
import dayjs, { type Dayjs } from "dayjs";
import { useNavigation } from "@react-navigation/native";
import { useAppDispatch } from "@/store";
import { useToast } from "@/ui";
import { getErrorMessage } from "@/services/api/errors";
import { useCreateBookingMutation, useGetUserBookingsQuery } from "@/features/customer/api";
import { setPendingPayment } from "./slice";
import { bookingLocationFields, displayText, type PickedLocation } from "./places/pickedLocation";
import { HOUR_LIMITS, RATE_LIMITS, combineStart, validateFlow, FLOW_STEPS } from "./bookingForm";
import { serviceName } from "./services";

/** State, validation and submit of the one-page booking form. The screen only lays it out. */
export function useBookingForm() {
	const navigation = useNavigation();
	const dispatch = useAppDispatch();
	const toast = useToast();
	const [createBooking, { isLoading: submitting }] = useCreateBookingMutation();

	const [serviceId, setServiceId] = useState<number | null>(null);
	const [day, setDay] = useState<Dayjs | null>(null);
	const [minutes, setMinutes] = useState<number | null>(null);
	const [hours, setHours] = useState<number>(HOUR_LIMITS.initial);
	const [rate, setRate] = useState<number>(RATE_LIMITS.initial);
	const [location, setLocation] = useState<PickedLocation | null>(null);
	const [showErrors, setShowErrors] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);

	// The map opens at the customer's last booking when there is no pin yet.
	const { data: past } = useGetUserBookingsQuery();
	const startPoint = useMemo(() => {
		const all = past ? [...past.active, ...past.scheduled, ...past.history] : [];
		const last = all
			.filter((b) => typeof b.latitude === "number" && typeof b.longitude === "number" && b.createdAt)
			.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];
		return last?.latitude !== undefined && last.longitude !== undefined
			? { latitude: last.latitude, longitude: last.longitude }
			: null;
	}, [past]);

	const address = displayText(location);
	const start = combineStart(day, minutes);
	const errors = validateFlow({ serviceId, day, minutes, address, pinned: !!location });
	// Before the first submit only "that time has passed" shows, once both values exist.
	const visible = (key: keyof typeof errors) =>
		showErrors || (key === "time" && start && errors.time?.includes("passed")) ? errors[key] : undefined;

	const done = {
		service: !errors.service,
		when: !errors.date && !errors.time,
		// Hours and rate always have valid values, so the section is done once the shift is set.
		hours: !errors.date && !errors.time,
		address: !errors.address,
	};
	const steps = [done.service, done.when, done.hours, done.address];
	const current = steps.indexOf(false) === -1 ? FLOW_STEPS.length - 1 : steps.indexOf(false);
	const missing = [
		errors.service && "a service",
		(errors.date || errors.time) && "a start time",
		errors.address && "an address",
	].filter((m): m is string => !!m);

	const reset = () => {
		setServiceId(null);
		setDay(null);
		setMinutes(null);
		setHours(HOUR_LIMITS.initial);
		setRate(RATE_LIMITS.initial);
		setLocation(null);
		setShowErrors(false);
		setSubmitError(null);
	};

	const submit = async () => {
		if (missing.length > 0 || errors.time || !serviceId || !day || !start || !location) {
			setShowErrors(true);
			toast.error(missing.length ? `Still needed: ${missing.join(", ")}.` : (errors.time ?? "Check the form."));
			return;
		}
		setSubmitError(null);
		try {
			const startAt = start.toISOString();
			const fields = bookingLocationFields(location);
			// startDate and startTime stay for older servers; startAt is the exact instant the customer chose.
			const result = await createBooking({
				service: serviceId,
				rate,
				hours,
				startAt,
				startDate: day.toISOString(),
				startTime: startAt,
				...fields,
			}).unwrap();
			dispatch(
				setPendingPayment({
					bookingId: result.bookingId,
					clientSecret: result.clientSecret,
					paymentIntentId: result.paymentIntentId,
					serviceId,
					rate,
					hours,
					startAt,
					address: fields.customAddress ?? fields.address,
					latitude: location.latitude,
					longitude: location.longitude,
				}),
			);
			reset();
			// Back from payment lands on the bookings list, where the new booking is.
			navigation.navigate("CustomerHome", { screen: "BookingsTab", params: { tab: "scheduled" } });
			navigation.navigate("BookingPayment");
		} catch (err) {
			const message = getErrorMessage(err, "Could not create the booking. Try again.");
			setSubmitError(message);
			toast.error(message);
		}
	};

	return {
		serviceId,
		setServiceId,
		serviceName: serviceId ? serviceName(serviceId) : null,
		day,
		setDay,
		minutes,
		setMinutes,
		hours,
		setHours,
		rate,
		setRate,
		location,
		setLocation,
		startPoint,
		start,
		address,
		total: rate * hours,
		visible,
		done,
		current,
		missing,
		submit,
		submitting,
		submitError,
		dismissSubmitError: () => setSubmitError(null),
		reset,
		today: dayjs().startOf("day"),
	};
}
