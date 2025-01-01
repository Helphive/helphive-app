const NAME_REGEX = /^[a-zA-Z\xC0-\uFFFF]+([ \-']{0,1}[a-zA-Z\xC0-\uFFFF]+){0,2}[.]{0,1}$/;
const EMAIL_REGEX =
	/(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9]))\.){3}(?:(2(5[0-5]|[0-4][0-9])|1[0-9][0-9]|[1-9]?[0-9])|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/;
const PHONE_REGEX = /^\+\d{12}$/;

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
	if (!PHONE_REGEX.test(phone.trim())) {
		return "Valid phone number is required";
	}
	return "";
};

export const validateStreet = (street: string) => {
	if (!street.trim()) {
		return "Street address is required";
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

export const validatePassword = (password: string) => {
	if (!password.trim()) {
		return "Password is required";
	}
	if (password.length < 8) {
		return "Password must be at least 8 characters long";
	}
	if (!/[A-Z]/.test(password)) {
		return "Password must contain at least one uppercase letter";
	}
	if (!/[a-z]/.test(password)) {
		return "Password must contain at least one lowercase letter";
	}
	if (!/\d/.test(password)) {
		return "Password must contain at least one number";
	}
	if (!/[^A-Za-z0-9]/.test(password)) {
		return "Password must contain at least one special character";
	}
	return "";
};
