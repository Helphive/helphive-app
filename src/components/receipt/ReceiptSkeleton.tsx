import React from "react";
import { View } from "react-native";
import Skeleton from "../Skeleton";
import { SCREEN_PADDING } from "../details/tokens";

const ReceiptSkeleton = () => (
	<View style={{ padding: SCREEN_PADDING }}>
		<Skeleton width="100%" height={130} radius={16} />
		<View style={{ height: 16 }} />
		<Skeleton width="60%" height={20} />
		<View style={{ height: 12 }} />
		<Skeleton width="100%" height={16} />
		<View style={{ height: 8 }} />
		<Skeleton width="100%" height={16} />
		<View style={{ height: 8 }} />
		<Skeleton width="100%" height={16} />
		<View style={{ height: 24 }} />
		<Skeleton width="100%" height={160} radius={16} />
	</View>
);

export default ReceiptSkeleton;
