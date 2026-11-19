import React, { memo, useMemo, useState } from "react";
import { StyleSheet, View, type LayoutChangeEvent, type ViewStyle } from "react-native";
import dayjs, { type Dayjs } from "dayjs";
import { Text } from "../Text";
import { color, radius } from "../tokens";

/** Decimal hour (8.5 = 08:30), "HH:mm", an ISO string, a Date or a dayjs value. */
export type TimeInput = number | string | Date | Dayjs;

export function toHour(t: TimeInput): number {
	if (typeof t === "number") return t;
	if (typeof t === "string") {
		const m = /^(\d{1,2}):(\d{2})$/.exec(t.trim());
		if (m) return Number(m[1]) + Number(m[2]) / 60;
	}
	const d = dayjs(t);
	return d.hour() + d.minute() / 60;
}

export function formatHour(h: number): string {
	const total = Math.round(h * 60);
	const hh = Math.floor(total / 60) % 24;
	const mm = total % 60;
	return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

/** Scale step giving at most `maxLabels` labels; prefers steps that land on both ends. */
export function pickTickStep(range: number, maxLabels: number): number {
	const steps = [1, 2, 3, 4, 6, 8, 12];
	const fits = (step: number) => range / step + 1 <= maxLabels;
	return steps.find((step) => fits(step) && range % step === 0) ?? steps.find(fits) ?? 12;
}

export interface ShiftBlock {
	start: TimeInput;
	/** End time; or give `hours` instead. */
	end?: TimeInput;
	hours?: number;
	/** Text inside the block. Defaults to "08:00 to 14:00". */
	label?: string;
	/** coral: the booking in focus. ink: other bookings. soft: tentative or past. */
	tone?: "coral" | "ink" | "soft";
	key?: string | number;
}

export interface ShiftRulerProps {
	blocks: ShiftBlock[];
	/** First visible hour (default 6). The range grows to fit blocks unless `fixed`. */
	from?: number;
	/** Last visible hour (default 22). Can exceed 24 for overnight shifts. */
	to?: number;
	fixed?: boolean;
	/** Draws the "now" marker. */
	now?: TimeInput;
	tickEvery?: number;
	hideScale?: boolean;
	accessibilityLabel?: string;
	style?: ViewStyle;
}

const TONES = {
	coral: { bg: color.coral600, fg: color.surface, border: color.coral600 },
	ink: { bg: color.ink900, fg: color.surface, border: color.ink900 },
	soft: { bg: color.coral50, fg: color.coral700, border: color.coral100 },
} as const;

/**
 * The signature element: a day's hours as a bar, each booking drawn as a block. Use it wherever a booking's time
 * appears as a whole (cards, details, the booking form summary, the provider's day).
 */
export const ShiftRuler = memo(function ShiftRuler({
	blocks,
	from = 6,
	to = 22,
	fixed = false,
	now,
	tickEvery,
	hideScale = false,
	accessibilityLabel,
	style,
}: ShiftRulerProps) {
	const [width, setWidth] = useState(0);
	const spans = useMemo(
		() =>
			blocks.map((b, i) => {
				const start = toHour(b.start);
				let end = b.end !== undefined ? toHour(b.end) : start + (b.hours ?? 1);
				if (end <= start) end += 24; // overnight
				return { ...b, start, end, key: b.key ?? i };
			}),
		[blocks],
	);

	let lo = from;
	let hi = to;
	if (!fixed) {
		for (const s of spans) {
			lo = Math.min(lo, Math.floor(s.start / 2) * 2);
			hi = Math.max(hi, Math.ceil(s.end / 2) * 2);
		}
	}
	const range = Math.max(1, hi - lo);
	const x = (h: number) => ((Math.min(Math.max(h, lo), hi) - lo) / range) * width;
	const step = tickEvery ?? pickTickStep(range, 5);
	const ticks: number[] = [];
	for (let h = lo; h <= hi + 1e-9; h += step) ticks.push(h);
	const nowHour = now !== undefined ? toHour(now) : undefined;

	const summary =
		accessibilityLabel ??
		`Shift ruler, ${formatHour(lo)} to ${formatHour(hi)}: ` +
			(spans.length
				? spans
						.map((s) => `${s.label ? `${s.label}, ` : ""}${formatHour(s.start)} to ${formatHour(s.end)}`)
						.join("; ")
				: "no bookings");

	const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

	return (
		<View accessible accessibilityRole="image" accessibilityLabel={summary} style={style}>
			<View style={styles.track} onLayout={onLayout}>
				{width > 0 &&
					Array.from({ length: range - 1 }, (_, i) => (
						<View key={`g${i}`} style={[styles.gridLine, { left: ((i + 1) / range) * width }]} />
					))}
				{width > 0 &&
					spans.map((s) => {
						const t = TONES[s.tone ?? "coral"];
						const left = x(s.start);
						const w = Math.max(x(s.end) - left, 3);
						const text = s.label ?? `${formatHour(s.start)} to ${formatHour(s.end)}`;
						return (
							<View
								key={s.key}
								style={[styles.block, { left, width: w, backgroundColor: t.bg, borderColor: t.border }]}
							>
								{w >= 84 ? (
									<Text variant="caption" weight="bold" numberOfLines={1} style={{ color: t.fg }}>
										{text}
									</Text>
								) : null}
							</View>
						);
					})}
				{width > 0 && nowHour !== undefined && nowHour >= lo && nowHour <= hi ? (
					<View style={[styles.now, { left: x(nowHour) - 1 }]}>
						<View style={styles.nowDot} />
					</View>
				) : null}
			</View>
			{!hideScale && width > 0 ? (
				<View style={styles.scale}>
					{ticks.map((h) => {
						const frac = (h - lo) / range;
						// Anchor slides from left-aligned at the start to right-aligned at the end.
						return (
							<Text key={h} variant="caption" style={[styles.tick, { left: frac * width - frac * 36 }]}>
								{formatHour(h)}
							</Text>
						);
					})}
				</View>
			) : null}
		</View>
	);
});

const styles = StyleSheet.create({
	track: {
		height: 30,
		borderWidth: 1,
		borderColor: color.line,
		borderRadius: radius.sm,
		backgroundColor: color.subtle,
		overflow: "hidden",
	},
	gridLine: { position: "absolute", top: 0, bottom: 0, width: 1, backgroundColor: color.line },
	block: {
		position: "absolute",
		top: 3,
		bottom: 3,
		borderRadius: 4,
		borderWidth: 1,
		justifyContent: "center",
		paddingHorizontal: 8,
	},
	now: { position: "absolute", top: 0, bottom: 0, width: 2, backgroundColor: color.ink900 },
	nowDot: {
		position: "absolute",
		top: -1,
		left: -3,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: color.ink900,
	},
	scale: { height: 16, marginTop: 6 },
	tick: { position: "absolute", width: 36, fontSize: 11, lineHeight: 16 },
});

export default ShiftRuler;
