import dayjs from "dayjs";
import { formatTimeAgo } from "@/lib/format";
import type { ChatMessage, Presence } from "./chatRuntime";

export const fullName = (p?: { firstName?: string; lastName?: string } | null, fallback = "") =>
	[p?.firstName, p?.lastName].filter(Boolean).join(" ") || fallback;

export const dayLabel = (msTime: number) => {
	const d = dayjs(msTime);
	if (d.isSame(dayjs(), "day")) return "Today";
	if (d.isSame(dayjs().subtract(1, "day"), "day")) return "Yesterday";
	return d.isSame(dayjs(), "year") ? d.format("ddd D MMM") : d.format("D MMM YYYY");
};

/** Short time for the conversation list: 14:05 today, "Yesterday", or the date. */
export const listTime = (msTime?: number) => {
	if (!msTime) return "";
	return dayjs(msTime).isSame(dayjs(), "day") ? dayjs(msTime).format("HH:mm") : dayLabel(msTime);
};

export const timeOfDay = (msTime: number) => dayjs(msTime).format("HH:mm");

export const presenceText = (p?: Presence) => {
	if (!p) return "";
	if (p.online) return "Online";
	return p.lastActiveAt ? `Last seen ${formatTimeAgo(new Date(p.lastActiveAt))}` : "Offline";
};

export const preview = (m?: ChatMessage | null) => {
	if (!m) return "";
	const who = m.mine ? "You: " : "";
	if (m.kind === "deleted") return "Message deleted";
	if (m.kind === "image") return `${who}${m.text || "Photo"}`;
	if (m.kind === "file") return `${who}${m.text || m.attachment?.name || "File"}`;
	return `${who}${m.text ?? ""}`;
};

export const sameDay = (a: number, b: number) => dayjs(a).isSame(dayjs(b), "day");
