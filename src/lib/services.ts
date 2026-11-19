const publicAreaAttendantImage = require("../../assets/icons/user-tabs/home/public-area-attendant.png");
const roomAttendantImage = require("../../assets/icons/user-tabs/home/room-attendant.png");
const linenPorterImage = require("../../assets/icons/user-tabs/home/linen-porter.png");

const publicAreaAttendantIcon = require("../../assets/icons/sofa.png");
const roomAttendantIcon = require("../../assets/icons/door.png");
const linenPorterIcon = require("../../assets/icons/bed.png");

const publicAreaAttendantDisabledIcon = require("../../assets/icons/sofa-disabled.png");
const roomAttendantDisabledIcon = require("../../assets/icons/door-disabled.png");
const linenPorterDisabledIcon = require("../../assets/icons/bed-disabled.png");

const services = [
	{
		id: 1,
		name: "Public Area Attendant",
		image: publicAreaAttendantImage,
		description: "Ensure the highest standards of cleanliness and order in public areas.",
		averageRate: "$45/hour",
		icon: publicAreaAttendantIcon,
		disabledIcon: publicAreaAttendantDisabledIcon,
	},
	{
		id: 2,
		name: "Room Attendant",
		image: roomAttendantImage,
		description: "Maintain guest rooms to the highest standards of cleanliness and comfort.",
		averageRate: "$35/hour",
		icon: roomAttendantIcon,
		disabledIcon: roomAttendantDisabledIcon,
	},
	{
		id: 3,
		name: "Linen Porter",
		image: linenPorterImage,
		description: "Efficiently manage and distribute linens to ensure smooth operations.",
		averageRate: "$60/hour",
		icon: linenPorterIcon,
		disabledIcon: linenPorterDisabledIcon,
	},
];

export default services;
