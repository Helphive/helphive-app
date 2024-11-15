import * as FileSystem from "expo-file-system";

const NAME_REGEX = /^[a-zA-Z\xC0-\uFFFF]+([ \-']{0,1}[a-zA-Z\xC0-\uFFFF]+){0,2}[.]{0,1}$/;
const EMAIL_REGEX =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;

export const validateFirstName = (firstName: string) => {
	if (!firstName.trim()) {
		return "First name is required";
	}
	if (!NAME_REGEX.test(firstName.trim())) {
		return "Must contain at least 2 letters and no special characters";
	}
	return "";
};

export const validateLastName = (lastName: string) => {
	if (!lastName.trim()) {
		return "Last name is required";
	}
	if (!NAME_REGEX.test(lastName.trim())) {
		return "Must contain at least 2 letters and no special characters";
	}
	return "";
};

export const validateEmail = (email: string) => {
	if (!email.trim()) {
		return "Email is required";
	}
	if (!EMAIL_REGEX.test(email.trim())) {
		return "Email is not valid";
	}
	return "";
};

export const validatePhone = (phone: string) => {
	if (!phone.trim()) {
		return "Phone number is required";
	}
	if (!/^(?:0|\+?92)[\s]?(?:\d\s?){10}$/.test(phone.trim())) {
		return "Phone number is not valid";
	}
	return "";
};

export const validateCountry = (country: string) => {
	if (!country.trim()) {
		return "Country is required";
	}
	return "";
};

export const validateState = (state: string) => {
	if (!state.trim()) {
		return "State is required";
	}
	return "";
};

export const validateCity = (city: string) => {
	if (!city.trim()) {
		return "City is required";
	}
	return "";
};

export const validateStreet = (street: string) => {
	if (!street.trim()) {
		return "Street address is required";
	}
	return "";
};

export const validateJobTypes = (jobTypes: any) => {
	if (!jobTypes.publicAreaAttendant && !jobTypes.roomAttendant && !jobTypes.linenPorter) {
		return "Select atleast 1 job";
	}
	return "";
};

export const validateId = async (id: any) => {
	if (!id) {
		return "ID is required";
	}
	try {
		const fileInfo = await FileSystem.getInfoAsync(id?.assets[0]?.uri);
		if (!fileInfo.exists) {
			return "ID does not exist";
		}
		if (
			!id?.assets[0]?.uri.toLowerCase().endsWith(".jpg") &&
			!id?.assets[0]?.uri.toLowerCase().endsWith(".jpeg") &&
			!id?.assets[0]?.uri.toLowerCase().endsWith(".png") &&
			!id?.assets[0]?.uri.toLowerCase().endsWith(".pdf")
		) {
			return "Invalid ID format";
		}
		return "";
	} catch (error) {
		console.error("Error validating ID:", error);
		return "Error validating ID";
	}
};

export const validateDbs = async (dbs: any) => {
	if (!dbs) {
		return "DBS certificate is required";
	}
	try {
		const fileInfo = await FileSystem.getInfoAsync(dbs?.assets[0]?.uri);
		if (!fileInfo.exists) {
			return "DBS certificate does not exist";
		}
		if (
			!dbs?.assets[0]?.uri.toLowerCase().endsWith(".jpg") &&
			!dbs?.assets[0]?.uri.toLowerCase().endsWith(".jpeg") &&
			!dbs?.assets[0]?.uri.toLowerCase().endsWith(".png") &&
			!dbs?.assets[0]?.uri.toLowerCase().endsWith(".pdf")
		) {
			return "Invalid DBS format";
		}
		return "";
	} catch (error) {
		console.error("Error validating DBS certificate:", error);
		return "Error validating DBS certificate";
	}
};

export const validateResume = async (resume: any) => {
	if (!resume) {
		return "Resume is required";
	}

	try {
		const fileInfo = await FileSystem.getInfoAsync(resume?.assets[0]?.uri);
		if (!fileInfo.exists) {
			return "Resume does not exist";
		}
		if (
			!resume?.assets[0]?.uri.toLowerCase().endsWith(".jpg") &&
			!resume?.assets[0]?.uri.toLowerCase().endsWith(".jpeg") &&
			!resume?.assets[0]?.uri.toLowerCase().endsWith(".png") &&
			!resume?.assets[0]?.uri.toLowerCase().endsWith(".pdf")
		) {
			return "Invalid Resume format";
		}
		return "";
	} catch (error) {
		console.error("Error validating resume:", error);
		return "Error validating resume";
	}
};

export const validateProfile = async (profile: any) => {
	if (!profile) {
		return "Profile is required";
	}

	try {
		const fileInfo = await FileSystem.getInfoAsync(profile?.assets[0]?.uri);
		if (!fileInfo.exists) {
			return "Profile does not exist";
		}
		if (
			!profile?.assets[0]?.uri.toLowerCase().endsWith(".jpg") &&
			!profile?.assets[0]?.uri.toLowerCase().endsWith(".jpeg") &&
			!profile?.assets[0]?.uri.toLowerCase().endsWith(".png")
		) {
			return "Invalid Profile format";
		}
		return "";
	} catch (error) {
		console.error("Error validating profile:", error);
		return "Error validating resume";
	}
};
