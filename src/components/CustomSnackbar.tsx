import React, { FC } from "react";
import { Snackbar as PaperSnackbar, SnackbarProps, Text } from "react-native-paper";
import { useAppTheme } from "../utils/theme";

const CustomSnackbar: FC<SnackbarProps> = ({ action, children, ...rest }) => {
	const theme = useAppTheme();

	return (
		<PaperSnackbar
			{...rest}
			style={{
				backgroundColor: theme.colors.surface,
				borderRadius: 8,
				elevation: 4,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.25,
				shadowRadius: 3.84,
			}}
			wrapperStyle={{
				paddingHorizontal: 20,
				marginBottom: 16,
			}}
			action={{
				label: action?.label || "OK",
				labelStyle: { color: theme.colors.primary },
				textColor: theme.colors.primary,
			}}
		>
			<Text style={{ color: theme.colors.onSurface }}>{children}</Text>
		</PaperSnackbar>
	);
};

export default CustomSnackbar;
