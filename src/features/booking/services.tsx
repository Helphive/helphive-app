import React from "react";
import { IconTile } from "@/ui";
import { LinenPorterIcon, PublicAreaIcon, RoomAttendantIcon, ServiceIconFallback, type AppIcon } from "@/ui/icons";

/** The services customers can book, with the web's names and descriptions (helphive-web/src/types SERVICES). */
export const SERVICES = [
	{ id: 1, name: "Public Area Attendant", description: "Cleaning and maintenance of public spaces" },
	{ id: 2, name: "Room Attendant", description: "Hotel room cleaning and preparation" },
	{ id: 3, name: "Linen Porter", description: "Linen handling and distribution" },
] as const;

const ICONS: Record<number, AppIcon> = { 1: PublicAreaIcon, 2: RoomAttendantIcon, 3: LinenPorterIcon };

export const serviceName = (id?: number | null, fallback?: string) =>
	fallback || SERVICES.find((s) => s.id === id)?.name || "Service";

/** Bed, broom or folded shirt. `tile` is the duotone coral tile used where the icon is the main visual. */
export function ServiceIcon({
	serviceId,
	tile,
	size = 20,
}: {
	serviceId?: number | null;
	tile?: boolean;
	size?: number;
}) {
	const Icon = (serviceId && ICONS[serviceId]) || ServiceIconFallback;
	return tile ? <IconTile icon={Icon} size={40} /> : <Icon size={size} />;
}
