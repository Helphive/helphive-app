import React, { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import dayjs, { type Dayjs } from "dayjs";
import { Button, SelectableTileGroup, Text, radius, space, makeStyles, useTheme, formatHour } from "@/ui";
import { CalendarIcon, TimeIcon } from "@/ui/icons";
import { formatDay } from "@/lib/format";
import { QUICK_TIMES, getDayOptions, minutesOf } from "../bookingForm";
import { FieldLabel } from "./FormParts";

const OTHER = "other";

/** Date as seven day tiles plus "Other date"; start time as quick tiles plus "Other time" (system pickers). */
export function WhenPicker({
	day,
	minutes,
	onDay,
	onMinutes,
	dateError,
	timeError,
}: {
	day: Dayjs | null;
	minutes: number | null;
	onDay: (d: Dayjs) => void;
	onMinutes: (m: number) => void;
	dateError?: string;
	timeError?: string;
}) {
	const { color, scheme } = useTheme();
	const styles = useStyles();
	const days = useMemo(() => getDayOptions(), []);
	const [picker, setPicker] = useState<"date" | "time" | null>(null);
	const dayKey = day?.format("YYYY-MM-DD") ?? null;
	const otherDay = !!day && !days.some((d) => d.format("YYYY-MM-DD") === dayKey);
	const timeLabel = minutes !== null ? formatHour(minutes / 60) : null;
	const otherTime = !!timeLabel && !(QUICK_TIMES as readonly string[]).includes(timeLabel);

	const onPicked = (event: DateTimePickerEvent, date?: Date) => {
		const which = picker;
		setPicker(null);
		if (event.type !== "set" || !date) return;
		if (which === "date") onDay(dayjs(date).startOf("day"));
		else onMinutes(date.getHours() * 60 + date.getMinutes());
	};

	return (
		<View style={styles.stack}>
			<View>
				<FieldLabel>Date</FieldLabel>
				<View accessibilityRole="radiogroup" accessibilityLabel="Date" style={styles.days}>
					{days.map((d, i) => {
						const selected = dayKey === d.format("YYYY-MM-DD");
						return (
							<View key={d.format("YYYY-MM-DD")} style={styles.dayCell}>
								<Pressable
									accessibilityRole="radio"
									accessibilityState={{ checked: selected }}
									accessibilityLabel={d.format("dddd D MMMM")}
									onPress={() => onDay(d)}
									style={({ pressed }) => [
										styles.day,
										selected ? styles.daySelected : pressed && styles.dayPressed,
									]}
								>
									<Text variant="caption" style={selected ? styles.onInk : styles.dayName}>
										{i === 0 ? "Today" : d.format("ddd")}
									</Text>
									<Text variant="subheading" weight="extrabold" style={selected && styles.onInk}>
										{d.format("D")}
									</Text>
								</Pressable>
							</View>
						);
					})}
					<View style={styles.dayCell}>
						<Pressable
							accessibilityRole="radio"
							accessibilityState={{ checked: otherDay }}
							accessibilityLabel={otherDay ? `Other date, ${day?.format("dddd D MMMM")}` : "Other date"}
							onPress={() => setPicker("date")}
							style={({ pressed }) => [
								styles.day,
								otherDay ? styles.daySelected : pressed && styles.dayPressed,
							]}
						>
							{otherDay ? (
								<>
									<Text variant="caption" style={styles.onInk}>
										{day?.format("MMM")}
									</Text>
									<Text variant="subheading" weight="extrabold" style={styles.onInk}>
										{day?.format("D")}
									</Text>
								</>
							) : (
								<>
									<CalendarIcon size={18} color={color.ink900} />
									<Text variant="caption" color="ink900" align="center">
										Other date
									</Text>
								</>
							)}
						</Pressable>
					</View>
				</View>
				{otherDay ? (
					<Text variant="small" style={styles.note}>
						{formatDay(day)}. Tap the last tile to change it.
					</Text>
				) : null}
				{dateError ? <Error text={dateError} /> : null}
			</View>

			<View>
				<FieldLabel>Start time</FieldLabel>
				<SelectableTileGroup<string>
					size="compact"
					accessibilityLabel="Start time"
					value={otherTime ? OTHER : timeLabel}
					onChange={(v) => (v === OTHER ? setPicker("time") : onMinutes(minutesOf(v)))}
					options={[
						...QUICK_TIMES.map((t) => ({ value: t, title: t })),
						{ value: OTHER, title: otherTime && timeLabel ? timeLabel : "Other" },
					]}
				/>
				{otherTime ? (
					<View style={styles.otherTime}>
						<Button size="sm" variant="secondary" icon={TimeIcon} onPress={() => setPicker("time")}>
							{`Change time (${timeLabel})`}
						</Button>
					</View>
				) : null}
				{timeError ? <Error text={timeError} /> : null}
			</View>

			{picker ? (
				<DateTimePicker
					value={
						picker === "date"
							? (day ?? dayjs()).toDate()
							: dayjs()
									.startOf("day")
									.add(minutes ?? 9 * 60, "minute")
									.toDate()
					}
					mode={picker}
					themeVariant={scheme}
					is24Hour
					minimumDate={picker === "date" ? dayjs().startOf("day").toDate() : undefined}
					onChange={onPicked}
				/>
			) : null}
		</View>
	);
}

function Error({ text }: { text: string }) {
	const styles = useStyles();
	return (
		<Text variant="small" color="red700" style={styles.note} accessibilityLiveRegion="polite">
			{text}
		</Text>
	);
}

const useStyles = makeStyles(({ color, pressedRow }) => ({
	stack: { gap: space[5] },
	days: { flexDirection: "row", flexWrap: "wrap", margin: -4 },
	dayCell: { width: "25%", padding: 4 },
	day: {
		minHeight: 60,
		borderRadius: radius.sm,
		borderWidth: 1,
		borderColor: color.lineStrong,
		backgroundColor: color.surface,
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: space[2],
		gap: 2,
	},
	// The day picker is the one place selection is an ink fill (as on the web).
	daySelected: { backgroundColor: color.inkFill, borderColor: color.inkFill },
	dayPressed: { backgroundColor: pressedRow },
	dayName: { color: color.ink600 },
	onInk: { color: color.onInk },
	note: { marginTop: space[2] },
	otherTime: { marginTop: space[2], alignItems: "flex-start" },
}));
