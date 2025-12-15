export function fontWeightNameToValue(name: string | number) {
	switch (`${name}`.toLowerCase()) {
		case "thin":
			return 100;
		case "extra-light":
		case "extra light":
			return 200;
		case "light":
			return 300;
		case "normal":
			return 400;
		case "medium":
			return 500;
		case "semi-bold":
		case "semi bold":
			return 600;
		case "bold":
			return 700;
		case "extra-bold":
		case "extra bold":
			return 800;
		case "black":
			return 900;
		case "extra black":
			return 950;
	}
	return name;
}
