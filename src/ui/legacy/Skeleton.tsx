import React, { useEffect, useRef } from "react";
import { Animated, DimensionValue, ViewStyle } from "react-native";

interface SkeletonProps {
	width: DimensionValue;
	height: number;
	radius?: number;
	style?: ViewStyle;
}

const Skeleton = ({ width, height, radius = 8, style }: SkeletonProps) => {
	const opacity = useRef(new Animated.Value(0.4)).current;

	useEffect(() => {
		const loop = Animated.loop(
			Animated.sequence([
				Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
				Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
			]),
		);
		loop.start();
		return () => loop.stop();
	}, [opacity]);

	return (
		<Animated.View style={[{ width, height, borderRadius: radius, backgroundColor: "#E4E7EC", opacity }, style]} />
	);
};

export default Skeleton;
