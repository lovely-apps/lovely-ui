/** @param {string[]} list */
export function toCamelCase(list) {
	return list
		.join(" ")
		.split(/[\s-_]+/)
		.map((word, index) => {
			if (index === 0) {
				return word.toLowerCase();
			}
			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join("")
		.replaceAll(/\./gi, "_");
}

/** @param {string[]} list */
export function toKebabCase(list) {
	return list
		.join(" ")
		.toLowerCase()
		.replaceAll(/[^a-z0-9\-]+/gi, "-");
}

/** @param {string} camel */
export function fromCamelToKebab(camel) {
	return camel.replaceAll(/(?<!^)([A-Z]+)/g, (match) =>
		`-${match}`.toLowerCase(),
	);
}
