import React from "react";
import { IconTile } from "@/ui";
import { LinenPorterIcon, PublicAreaIcon, RoomAttendantIcon, ServiceIconFallback, type AppIcon } from "@/ui/icons";

/** Service ids as the API sends them: 1 public area attendant, 2 room attendant, 3 linen porter. */
export const SERVICE_ICONS: Record<number, AppIcon> = {
	1: PublicAreaIcon,
	2: RoomAttendantIcon,
	3: LinenPorterIcon,
};

export const serviceIcon = (id?: number): AppIcon => (id && SERVICE_ICONS[id]) || ServiceIconFallback;

/** The service's icon as a duotone tile (the main visual of an order row). */
export function ServiceTile({ serviceId, size = 40 }: { serviceId?: number; size?: number }) {
	return <IconTile icon={serviceIcon(serviceId)} size={size} />;
}
