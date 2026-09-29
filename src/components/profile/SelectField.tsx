import React from "react";
import { View } from "react-native";
import { HelperText, Icon, Text } from "react-native-paper";
import SelectDropdown from "react-native-select-dropdown";
import { useAppTheme } from "../../utils/theme";

type Option = { label: string; value: string };

type Props = {
	data: Option[];
	placeholder: string;
	// Value stored on the user (lowercase); used to preselect the dropdown.
	initialValue?: string;
	onSelect: (value: string) => void;
	disabled?: boolean;
	error?: string;
};

const capitalize = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

const SelectField = ({ data, placeholder, initialValue, onSelect, disabled, error }: Props) => {
	const theme = useAppTheme();
	return (
		<View style={{ marginTop: 8 }}>
			<SelectDropdown
				data={data}
				onSelect={(item: Option) => onSelect(item.value || "")}
				disabled={disabled}
				defaultValue={
					initialValue ? { label: capitalize(initialValue), value: initialValue.toLowerCase() } : null
				}
				renderButton={(selected: Option | null, isOpened: boolean) => (
					<View
						style={{
							width: "100%",
							height: 52,
							backgroundColor: theme.colors.background,
							borderRadius: 8,
							flexDirection: "row",
							alignItems: "center",
							paddingHorizontal: 12,
							borderWidth: 1,
							borderColor: error ? theme.colors.error : theme.colors.outline,
							opacity: disabled ? 0.5 : 1,
						}}
					>
						<Text
							style={{
								flex: 1,
								fontSize: 16,
								color: selected ? theme.colors.onSurface : theme.colors.onSurfaceDisabled,
							}}
						>
							{selected ? selected.label : placeholder}
						</Text>
						<Icon source={isOpened ? "chevron-up" : "chevron-down"} size={26} />
					</View>
				)}
				renderItem={(item: Option, _index: number, isSelected: boolean) => (
					<View
						style={{
							width: "100%",
							flexDirection: "row",
							paddingHorizontal: 12,
							alignItems: "center",
							paddingVertical: 8,
							backgroundColor: isSelected ? "#D2D9DF" : theme.colors.background,
						}}
					>
						<Text style={{ flex: 1, fontSize: 16, color: theme.colors.bodyColor, padding: 5 }}>
							{item.label}
						</Text>
						{isSelected && <Icon source="check" size={20} color={theme.colors.primary} />}
					</View>
				)}
				showsVerticalScrollIndicator={false}
				dropdownStyle={{ backgroundColor: theme.colors.background, borderRadius: 8 }}
			/>
			{!!error && <HelperText type="error">{error}</HelperText>}
		</View>
	);
};

export default SelectField;
