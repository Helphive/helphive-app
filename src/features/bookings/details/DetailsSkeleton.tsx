import React from "react";
import { View } from "react-native";
import Skeleton from "@/ui/legacy/Skeleton";
import { SCREEN_PADDING } from "@/features/bookings/details/tokens";

const DetailsSkeleton = () => (
	<View style={{ padding: SCREEN_PADDING, gap: 16 }}>
		<Skeleton width={90} height={24} radius={12} />
		<Skeleton width="70%" height={30} />
		<Skeleton width="100%" height={150} radius={16} />
		<Skeleton width="100%" height={200} radius={16} />
		<Skeleton width="100%" height={140} radius={16} />
	</View>
);

export default DetailsSkeleton;
