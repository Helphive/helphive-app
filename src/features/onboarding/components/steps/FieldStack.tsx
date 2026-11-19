import React, { type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { space } from "@/ui";

/** Fields inside a step's panel, 20px apart. */
export function FieldStack({ children }: { children: ReactNode }) {
	return <View style={styles.stack}>{children}</View>;
}

const styles = StyleSheet.create({ stack: { gap: space[5] } });
