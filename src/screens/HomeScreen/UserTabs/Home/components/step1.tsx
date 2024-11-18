import React from "react";
import { View, Image, TouchableOpacity, FlatList } from "react-native";
import { Button, Text, TextInput, IconButton } from "react-native-paper";
import { useAppTheme } from "../../../../../utils/theme";

const Step1Content = ({
	onNext,
	services,
	selectedService,
	setSelectedService,
	rate,
	setRate,
	disableNext,
}: {
	onNext: () => void;
	services: Array<{
		id: number;
		name: string;
		image: any;
		description: string;
		averageRate: string;
	}>;
	selectedService: number | null;
	setSelectedService: (id: number | null) => void;
	rate: string;
	setRate: (rate: string) => void;
	disableNext: boolean;
}) => {
	const theme = useAppTheme();

	const handleServiceSelect = (id: number) => {
		setSelectedService(selectedService === id ? null : id);
	};

	const handleRateChange = (text: string) => {
		setRate(text); // Update rate as text
	};

	const handleRateIncrease = () => {
		const currentRate = parseInt(rate, 10) || 0;
		if (currentRate < 200) {
			// Max 200
			setRate((currentRate + 1).toString());
		}
	};

	const handleRateDecrease = () => {
		const currentRate = parseInt(rate, 10) || 0;
		if (currentRate > 20) {
			// Start from 20
			setRate((currentRate - 1).toString());
		}
	};

	return (
		<View className="flex justify-between h-full">
			<View style={{ flex: 1 }}>
				<Text variant="titleMedium" className="mb-2 text-left" style={{ fontFamily: theme.colors.fontBold }}>
					Select a Service
				</Text>
				<View className="flex-1">
					<FlatList
						data={services}
						keyExtractor={(item) => item.id.toString()}
						renderItem={({ item: service }) => (
							<TouchableOpacity
								onPress={() => handleServiceSelect(service.id)}
								style={{
									flexDirection: "row",
									marginBottom: 16,
									borderRadius: 10,
									padding: 10,
									alignItems: "center",
									backgroundColor:
										selectedService === service.id
											? theme.colors.primaryContainer
											: theme.colors.surface,
									shadowColor: "#000",
									shadowOffset: { width: 0, height: 2 },
									shadowOpacity: 0.1,
									shadowRadius: 3.84,
									elevation: 5,
									marginHorizontal: 10, // Added margin to ensure shadow visibility
								}}
							>
								<Image
									source={service.image}
									style={{ width: 100, height: 100, borderRadius: 5, marginRight: 10 }}
								/>
								<View style={{ flex: 1 }}>
									<Text
										variant="titleMedium"
										style={{
											fontFamily: theme.colors.fontBold,
											color: theme.colors.onSurface,
											marginBottom: 8,
										}}
									>
										{service.name}
									</Text>
									<Text
										variant="bodySmall"
										style={{ color: theme.colors.onSurfaceVariant, marginBottom: 2 }}
									>
										{service.description}
									</Text>
									<Text
										style={{ color: theme.colors.onBackground, fontFamily: theme.colors.fontBold }}
									>
										Average Rate:{" "}
										<Text style={{ color: theme.colors.onBackground }}>{service.averageRate}</Text>
									</Text>
								</View>
							</TouchableOpacity>
						)}
						showsVerticalScrollIndicator={false}
						ListHeaderComponent={<View style={{ height: 5 }} />}
						ListFooterComponent={<View style={{ height: 5 }} />}
					/>
				</View>
			</View>
			<View>
				<Text
					variant="titleMedium"
					className="mt-3 mb-2 text-left"
					style={{ fontFamily: theme.colors.fontBold }}
				>
					Price Details
				</Text>
				<View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
					<IconButton
						icon="minus"
						size={20}
						style={{
							backgroundColor:
								parseInt(rate, 10) <= 20 ? theme.colors.surfaceDisabled : theme.colors.primary,
						}}
						onPress={handleRateDecrease}
						disabled={parseInt(rate, 10) <= 20}
						iconColor={parseInt(rate, 10) <= 20 ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary}
					/>
					<TextInput
						label="Rate ($/hour)"
						value={rate}
						onChangeText={handleRateChange}
						keyboardType="numeric"
						mode="outlined"
						style={{ flex: 1 }}
						theme={{
							colors: { primary: theme.colors.primary },
						}}
					/>
					<IconButton
						icon="plus"
						size={20}
						style={{
							backgroundColor:
								parseInt(rate, 10) >= 200 ? theme.colors.surfaceDisabled : theme.colors.primary,
						}}
						onPress={handleRateIncrease}
						disabled={parseInt(rate, 10) >= 200}
						iconColor={parseInt(rate, 10) >= 200 ? theme.colors.onSurfaceDisabled : theme.colors.onPrimary}
					/>
				</View>
				<Button
					mode="contained"
					onPress={onNext}
					className="mb-4"
					theme={{
						roundness: 2,
					}}
					disabled={disableNext}
					key={disableNext ? "disabled" : "enabled"}
				>
					<Text
						style={{
							fontFamily: theme.colors.fontBold,
							color: disableNext ? theme.colors.onSurfaceDisabled : theme.colors.buttonText,
							padding: 5,
						}}
					>
						Next
					</Text>
				</Button>
			</View>
		</View>
	);
};

export default Step1Content;
