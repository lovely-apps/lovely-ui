import * as prettier from "prettier";
import { fileHeader } from "style-dictionary/utils";

import { fromCamelToKebab, toKebabCase } from "../string.mjs";

/** @type import('style-dictionary').Format */
export default {
	name: "lovely-ui/scss/mixins",
	format: async ({ dictionary, file, options }) => {
		const mixinMap = new Map();
		const reverseIncludeLookup = new Map();
		for (const { path, attributes, $value, original } of dictionary.allTokens) {
			const lastToken = path[path.length - 1];

			const mixinName = toKebabCase(
				[
					attributes.folder === "color" && attributes.type === "typography"
						? attributes.type
						: attributes.folder,
					attributes.kind,
					attributes.item,
					attributes.style,
					attributes.meaning,
					attributes.variant,
				].filter((s) => !!s),
			);
			const mixinNameNoVariant = toKebabCase(
				[
					attributes.folder === "color" && attributes.type === "typography"
						? attributes.type
						: attributes.folder,
					attributes.kind,
					attributes.item,
					attributes.style,
					attributes.meaning,
				].filter((s) => !!s),
			);
			let mixinRef;
			if (mixinMap.has(mixinName)) {
				mixinRef = mixinMap.get(mixinName);
			} else {
				mixinRef = {
					includes: new Set(),
					conditionalProps: {},
					properties: [],
				};
				mixinMap.set(mixinName, mixinRef);
			}

			if (
				mixinNameNoVariant !== mixinName &&
				mixinMap.has(mixinNameNoVariant)
			) {
				// We have a base non-variant version. Include that
				mixinRef.includes.add(mixinNameNoVariant);

				if (!reverseIncludeLookup.has(mixinNameNoVariant)) {
					reverseIncludeLookup.set(mixinNameNoVariant, new Set());
				}
				reverseIncludeLookup.get(mixinNameNoVariant).add(mixinName);
			}

			let propertyName = fromCamelToKebab(lastToken);
			if (attributes.attribute) {
				propertyName = `${attributes.attribute}${attributes.value ? `-${attributes.value}` : ""}`;
			} else if (
				attributes.type === "typography" &&
				attributes.folder === "color"
			) {
				propertyName = "color";
			} else if (
				attributes.type === "background" &&
				attributes.folder === "color"
			) {
				propertyName = "background-color";
			}

			let mediaQueries = [];
			let selectors = [];
			if (attributes.screen) {
				switch (attributes.screen) {
					case "extra small":
						mediaQueries.push(
							'(max-width: $map.get($lovely-ui-semantic, "size", "semantic", "screen", "extra small"))',
						);
						break;
					case "small":
						mediaQueries.push(
							'(max-width: $map.get($lovely-ui-semantic, "size", "semantic", "screen", "small"))',
						);
						break;
					case "medium":
						mediaQueries.push(
							'(max-width: $map.get($lovely-ui-semantic, "size", "semantic", "screen", "medium"))',
						);
						break;
					case "large":
						mediaQueries.push(
							'(min-width: $map.get($lovely-ui-semantic, "size", "semantic", "screen", "large"))',
						);
						break;
					case "extra lage":
						mediaQueries.push(
							'(min-width: $map.get($lovely-ui-semantic, "size", "semantic", "screen", "extra large"))',
						);
						break;
				}
			}
			if (attributes.theme) {
				switch (attributes.theme) {
					case "light":
						mediaQueries.push("(prefers-color-scheme: light)");
						break;
					case "dark":
						mediaQueries.push("(prefers-color-scheme: dark)");
						break;
				}
			}
			if (attributes.state) {
				switch (attributes.state) {
					case "hover":
						selectors.push("&[data-hovered]");
						break;
					case "focus":
						selectors.push("&[data-focus-visible]");
						break;
					case "active":
						selectors.push("&[data-active], &[data-pressed], &[data-open]");
						break;
					case "selected":
						selectors.push("&[data-selected]");
						break;
					case "disabled":
						selectors.push("&[data-disabled]");
						break;
					case "invalid":
						selectors.push("&[data-invalid]");
						break;
				}
			}

			mixinRef.properties.push({
				mediaQuery: mediaQueries.length
					? `@media ${mediaQueries.join(" and ")}`
					: undefined,
				selectors: selectors.length ? selectors.join(", ") : undefined,
				$name: propertyName,
				$value,
			});
		}

		// Move common properties to common includes
		for (const [include, refs] of reverseIncludeLookup.entries()) {
			const includeMixin = mixinMap.get(include);
			for (const refName of refs.values()) {
				const refMixin = mixinMap.get(refName);
				for (const prop of refMixin.properties) {
					if (includeMixin.properties.find((p) => p.$name === prop.$name)) {
						continue;
					}

					let foundNonMatch = false;
					const propCompare = JSON.stringify(prop);
					// check if all other references have the same value
					for (const otherRef of refs.values()) {
						const otherMixin = mixinMap.get(otherRef);
						foundNonMatch =
							foundNonMatch ||
							!otherMixin.properties.some(
								(p) => JSON.stringify(p) === propCompare,
							);
					}

					if (!foundNonMatch) {
						includeMixin.properties.push(prop);

						for (const otherRef of refs.values()) {
							const otherMixin = mixinMap.get(otherRef);
							otherMixin.properties = otherMixin.properties.filter(
								(p) => JSON.stringify(p) !== propCompare,
							);
						}
					}
				}
			}
		}

		const header = await fileHeader({ file });

		const mixins = [...mixinMap.entries()]
			.map(([name, { properties, includes }]) => {
				const groupedBy = Object.groupBy(properties, (property) => {
					let prefix = "";
					let suffix = "";

					if (property.mediaQuery) {
						prefix += `${property.mediaQuery} {\n`;
						suffix += `\n}`;
					}
					if (property.selectors) {
						prefix += `${property.selectors} {\n`;
						suffix += `\n}`;
					}

					return `${prefix}%s${suffix}`;
				});

				const propStrings = Object.entries(groupedBy)
					.map(([replaceStr, props]) => {
						return replaceStr.replace(
							"%s",
							props.map((prop) => `${prop.$name}: ${prop.$value};`).join("\n"),
						);
					})
					.join("\n\n");

				return `@mixin ${name} {${includes.size ? "\n  " + [...includes].map((i) => `@include ${i};`).join("\n  ") : ""}
  ${propStrings}
}`;
			})
			.join("\n\n");

		return await prettier.format(
			`${header}
@use "sass:map";

${mixins}
`,
			{ filepath: "file.scss" },
		);
	},
};
