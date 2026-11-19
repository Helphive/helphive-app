import React from "react";
import { StyleSheet, View } from "react-native";
import { Button, Notice, PageTitle, Screen, SelectableTileGroup, ShiftRuler, StepProgress, Text, space } from "@/ui";
import { formatTime, pluralHours, formatMoney } from "@/lib/format";
import { useBookingForm } from "../useBookingForm";
import { FLOW_STEPS, HOUR_LIMITS, RATE_LIMITS } from "../bookingForm";
import { SERVICES, ServiceIcon } from "../services";
import { LocationPicker } from "../places/LocationPicker";
import { FieldLabel, FlowSection, Stepper } from "../components/FormParts";
import { WhenPicker } from "../components/WhenPicker";
import { BookingSummary, SummaryBar } from "../components/BookingSummary";

/** Book a service: the web's one-page booking form at phone width (helphive-web/src/pages/user/BookingFlow.tsx). */
export default function BookServiceScreen() {
	const f = useBookingForm();
	const end = f.start ? f.start.add(f.hours, "hour") : null;

	return (
		<Screen
			inTabs
			footer={
				<SummaryBar
					total={f.total}
					hours={f.hours}
					rate={f.rate}
					missing={f.missing}
					submitting={f.submitting}
					onSubmit={() => void f.submit()}
				/>
			}
		>
			<PageTitle title="Book a service" subtitle="Choose the service, the shift and the address. You pay next." />
			<StepProgress accessibilityLabel="Booking steps" steps={FLOW_STEPS} current={f.current} />

			{f.submitError ? (
				<Notice
					tone="error"
					title="The booking was not created"
					action={
						<Button size="sm" variant="secondary" onPress={f.dismissSubmitError}>
							Dismiss
						</Button>
					}
				>
					{f.submitError}
				</Notice>
			) : null}

			<FlowSection index={1} title="Service" done={f.done.service}>
				<SelectableTileGroup<string>
					accessibilityLabel="Service"
					value={f.serviceId ? String(f.serviceId) : null}
					onChange={(v) => f.setServiceId(Number(v))}
					options={SERVICES.map((s) => ({
						value: String(s.id),
						title: s.name,
						description: s.description,
						icon: <ServiceIcon serviceId={s.id} />,
					}))}
				/>
				{f.visible("service") ? <ErrorLine text={f.visible("service")} /> : null}
			</FlowSection>

			<FlowSection index={2} title="Date and start time" done={f.done.when}>
				<WhenPicker
					day={f.day}
					minutes={f.minutes}
					onDay={f.setDay}
					onMinutes={f.setMinutes}
					dateError={f.visible("date")}
					timeError={f.visible("time")}
				/>
			</FlowSection>

			<FlowSection index={3} title="Hours and hourly rate" done={f.done.hours}>
				<View style={styles.stack}>
					<View>
						<FieldLabel>{`Hours, ${HOUR_LIMITS.min} to ${HOUR_LIMITS.max}`}</FieldLabel>
						<Stepper
							label="Hours"
							value={pluralHours(f.hours)}
							canDecrease={f.hours > HOUR_LIMITS.min}
							canIncrease={f.hours < HOUR_LIMITS.max}
							onDecrease={() => f.setHours(f.hours - 1)}
							onIncrease={() => f.setHours(f.hours + 1)}
						/>
					</View>
					<View>
						<FieldLabel>{`Hourly rate, ${formatMoney(RATE_LIMITS.min)} to ${formatMoney(RATE_LIMITS.max)}`}</FieldLabel>
						<Stepper
							label="Hourly rate"
							value={`${formatMoney(f.rate)}/hr`}
							canDecrease={f.rate > RATE_LIMITS.min}
							canIncrease={f.rate < RATE_LIMITS.max}
							onDecrease={() => f.setRate(Math.max(RATE_LIMITS.min, f.rate - RATE_LIMITS.step))}
							onIncrease={() => f.setRate(Math.min(RATE_LIMITS.max, f.rate + RATE_LIMITS.step))}
						/>
					</View>
					{f.start && end ? (
						<View>
							<ShiftRuler
								blocks={[{ start: f.start.hour() + f.start.minute() / 60, hours: f.hours }]}
								accessibilityLabel={`Shift from ${formatTime(f.start)} to ${formatTime(end)}`}
							/>
							<Text variant="caption" style={styles.rulerCaption}>
								{`${formatTime(f.start)} to ${formatTime(end)}${end.isSame(f.start, "day") ? "" : " the next day"}, ${pluralHours(f.hours)}`}
							</Text>
						</View>
					) : (
						<Text variant="ui" color="ink600">
							Choose a date and start time to see the shift on the timeline.
						</Text>
					)}
				</View>
			</FlowSection>

			<FlowSection index={4} title="Address" done={f.done.address}>
				<LocationPicker
					value={f.location}
					onChange={f.setLocation}
					error={f.visible("address")}
					startPoint={f.startPoint}
				/>
			</FlowSection>

			<BookingSummary
				serviceId={f.serviceId}
				serviceName={f.serviceName}
				start={f.start}
				address={f.address}
				rate={f.rate}
				hours={f.hours}
			/>

			<View style={styles.clear}>
				<Button variant="text" size="sm" onPress={f.reset}>
					Clear the form
				</Button>
			</View>
		</Screen>
	);
}

function ErrorLine({ text }: { text?: string }) {
	return (
		<Text variant="small" color="red700" style={styles.error} accessibilityLiveRegion="polite">
			{text}
		</Text>
	);
}

const styles = StyleSheet.create({
	stack: { gap: space[5] },
	rulerCaption: { marginTop: space[2] },
	error: { marginTop: space[2] },
	clear: { alignItems: "flex-start", gap: space[1] },
});
