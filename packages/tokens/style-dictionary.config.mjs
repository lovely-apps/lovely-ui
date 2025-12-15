/** @import {Config} from "style-dictionary" */
import { fileHeader, minifyDictionary } from "style-dictionary/utils";

import { registerAll } from "./utils/formats/index.mjs";
import { toCamelCase, toKebabCase } from "./utils/string.mjs";

const BASE_BUILD_DIR = "dist";
const EXPANDED_TYPES = [
	"fontFamily",
	"fontSize",
	"fontWeight",
	"letterSpacinng",
	"lineHeight",
];

const FOLDERS_SPLIT = ["color", "size", "typography"];

registerAll();

/** @type Config */
export default {
	source: ["./**/*.json"],
	usesDtcg: true,

	hooks: {
		transforms: {
			"dtcg/unitValue": {
				type: "value",
				filter: (token) => {
					return !!(token.$value && token.$value.unit && token.$value.value);
				},
				transform: ({ $value }) => {
					return `${$value.value}${$value.unit}`;
				},
			},
			"typography/nameToValue": {
				type: "value",
				filter: (token) => {
					return token.$type === "fontWeight";
				},
				transform: ({ $value }) => {
					switch ($value.toString().toLowerCase()) {
						case "hairline":
						case "thin":
							return 100;
						case "extra-light":
						case "extra light":
							return 200;
						case "light":
							return 300;
						case "regular":
						case "normal":
							return 400;
						case "medium":
							return 500;
						case "demibold":
						case "demi bold":
						case "demi-bold":
						case "semibold":
						case "semi bold":
						case "semi-bold":
							return 500;
						case "bold":
							return 700;
						case "extra-bold":
						case "extra bold":
							return 800;
						case "heavy":
						case "black":
							return 900;
						default:
							return $value;
					}
				},
			},
			"lovely/themelessKebab": {
				type: "name",
				transform({ attributes, name, path }, { prefix }) {
					const lastToken = path[path.length - 1];
					const betterName = toKebabCase(
						[
							prefix,
							attributes.type,
							attributes.kind,
							attributes.item,
							attributes.style,
							attributes.variant,
							attributes.meaning,
							attributes.state,
							attributes.attribute,
							EXPANDED_TYPES.includes(lastToken) ? lastToken : undefined,
							attributes.value,
						].filter((s) => !!s),
					);

					return betterName || name;
				},
			},
			"lovely/kebabName": {
				type: "name",
				transform({ attributes, name, path }, { prefix }) {
					const lastToken = path[path.length - 1];
					const betterName = toKebabCase(
						[
							prefix,
							attributes.type,
							attributes.kind,
							attributes.item,
							attributes.style,
							attributes.variant,
							attributes.screen,
							attributes.theme,
							attributes.meaning,
							attributes.state,
							attributes.attribute,
							EXPANDED_TYPES.includes(lastToken) ? lastToken : undefined,
							attributes.value,
						].filter((s) => !!s),
					);

					return betterName || name;
				},
			},
			"lovely/camelName": {
				type: "name",
				transform({ attributes, name, path }, { prefix }) {
					const lastToken = path[path.length - 1];
					const betterName = toCamelCase(
						[
							prefix,
							attributes.type,
							attributes.kind,
							attributes.item,
							attributes.style,
							attributes.variant,
							attributes.screen,
							attributes.theme,
							attributes.meaning,
							attributes.state,
							attributes.attribute,
							EXPANDED_TYPES.includes(lastToken) ? lastToken : undefined,
							attributes.value,
						].filter((s) => !!s),
					);

					return betterName || name;
				},
			},
		},
		preprocessors: {
			tagIt(dictionary, {}) {
				function joinTags(tree, attrs) {
					const objs = [...Object.entries(tree)].filter(
						([_, v]) => typeof v === "object",
					);

					for (const [key, obj] of objs) {
						if (key.startsWith("$") || key === "attributes") {
							continue;
						}

						const subAttrs = { ...attrs };
						if (obj.$extensions?.tags?.length) {
							for (const tag of obj.$extensions.tags) {
								subAttrs[tag] = key;
							}
						}

						obj.attributes = { ...obj.attributes, ...subAttrs };

						joinTags(obj, subAttrs);
					}

					return tree;
				}

				return joinTags(dictionary, {});
			},
		},

		formats: {
			"javascript/cjs-map": async ({ dictionary, file, options }) => {
				const header = await fileHeader({ file, options });
				const content =
					header +
					"module.exports = " +
					JSON.stringify(minifyDictionary(dictionary.tokens, true), null, 2) +
					";\n";
				return content;
			},
			"javascript/cjs-index": async ({ file, options }) => {
				const header = await fileHeader({ file, options });
				const content = [header];

				for (const folder of FOLDERS_SPLIT) {
					content.push(
						`const ${toCamelCase([folder])} = require('./${folder}.cjs');`,
					);
				}

				content.push("\nmodule.exports = {");

				for (const folder of FOLDERS_SPLIT) {
					content.push(`  ...${toCamelCase([folder])},`);
				}

				content.push("};");

				return content.join("\n");
			},
			"javascript/esm-index": async ({ file, options }) => {
				const header = await fileHeader({ file, options });
				const content = [header];

				for (const folder of FOLDERS_SPLIT) {
					content.push(
						`import ${toCamelCase([folder])} from './${folder}.mjs';`,
					);
				}

				content.push("\nexport default {");

				for (const folder of FOLDERS_SPLIT) {
					content.push(`  ...${toCamelCase([folder])},`);
				}

				content.push("};");

				return content.join("\n");
			},
			"typescript/esm-declarations": async ({ dictionary, file, options }) => {
				const header = await fileHeader({ file, options });
				const name = dictionary.tokens[0]?.attributes?.folder || "tokens";
				const content = `${header}
export default ${name};

declare const ${name}: ${JSON.stringify(minifyDictionary(dictionary.tokens, true), null, 2)};
`;
				return content;
			},
			"typescript/esm-index-declarations": async ({
				dictionary,
				file,
				options,
			}) => {
				const header = await fileHeader({ file, options });
				const content = [header];

				for (const folder of FOLDERS_SPLIT) {
					content.push(
						`import ${toCamelCase([folder])} from './${folder}.mjs';`,
					);
				}

				content.push("\nexport default tokens;", "", "declare const tokens: {");

				for (const token of Object.keys(minifyDictionary(dictionary.tokens))) {
					content.push(
						`	${toCamelCase([token])}: ${toCamelCase([token])}.${toCamelCase([token])},`,
					);
				}

				content.push("};");

				return content.join("\n");
			},
		},
	},

	preprocessors: ["tagIt"],

	platforms: {
		scss: {
			expand: { include: ["typography"] },
			buildPath: `${BASE_BUILD_DIR}/scss/`,
			transforms: [
				"name/camel",
				"time/seconds",
				"html/icon",
				"size/rem",
				"color/css",
				"asset/url",
				"fontFamily/css",
				"cubicBezier/css",
				"strokeStyle/css/shorthand",
				"border/css/shorthand",
				"typography/css/shorthand",
				"transition/css/shorthand",
				"shadow/css/shorthand",
				"dtcg/unitValue",
				"typography/nameToValue",
				"lovely/kebabName",
			],
			files: [
				{
					destination: "variables.scss",
					format: "scss/variables",
					options: {
						themeable: false,
						outputReferences: true,
						outputReferenceFallbacks: true,
					},
				},
				{
					destination: "mixins.scss",
					filter: (token) => {
						return (
							token.path.includes("semantic") &&
							token.path.includes("typography") &&
							!token.path.includes("meaning")
						);
					},
					format: "lovely-ui/scss/mixins",
					options: {},
				},
			],
		},
		css: {
			expand: { include: ["typography"] },
			prefix: "lovely-ui",
			buildPath: `${BASE_BUILD_DIR}/css/`,
			transforms: [
				"name/kebab",
				"time/seconds",
				"html/icon",
				"size/rem",
				"color/css",
				"asset/url",
				"fontFamily/css",
				"cubicBezier/css",
				"strokeStyle/css/shorthand",
				"border/css/shorthand",
				"typography/css/shorthand",
				"transition/css/shorthand",
				"shadow/css/shorthand",
				"dtcg/unitValue",
				"lovely/themelessKebab",
			],
			files: [
				{
					destination: "core.css",
					filter: (token) => {
						return !token.attributes.theme && !token.attributes.screen;
					},
					format: "css/variables",
					options: {
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "base.css",
					filter: (token) => {
						return !token.path.includes("semantic");
					},
					format: "css/variables",
					options: {
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "semantic.css",
					filter: (token) => {
						return (
							token.path.includes("semantic") &&
							!token.attributes.theme &&
							!token.attributes.screen
						);
					},
					format: "css/variables",
					options: {
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "theme.light.css",
					filter: (token) => {
						return token.attributes.theme === "light";
					},
					format: "css/variables",
					options: {
						themedFile: true,
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "theme.dark.css",
					filter: (token) => {
						return token.attributes.theme === "dark";
					},
					format: "css/variables",
					options: {
						themedFile: true,
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "screen.extra-small.css",
					filter: (token) => {
						return (
							token.attributes.screen === "extra small" &&
							(token.attributes.type !== "screen" ||
								token.attributes.folder !== "size")
						);
					},
					format: "css/variables",
					options: {
						themedFile: true,
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "screen.small.css",
					filter: (token) => {
						return (
							token.attributes.screen === "small" &&
							(token.attributes.type !== "screen" ||
								token.attributes.folder !== "size")
						);
					},
					format: "css/variables",
					options: {
						themedFile: true,
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "screen.medium.css",
					filter: (token) => {
						return (
							token.attributes.screen === "medium" &&
							(token.attributes.type !== "screen" ||
								token.attributes.folder !== "size")
						);
					},
					format: "css/variables",
					options: {
						themedFile: true,
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "screen.large.css",
					filter: (token) => {
						return (
							token.attributes.screen === "large" &&
							(token.attributes.type !== "screen" ||
								token.attributes.folder !== "size")
						);
					},
					format: "css/variables",
					options: {
						themedFile: true,
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
				{
					destination: "screen.extra-large.css",
					filter: (token) => {
						return (
							token.attributes.screen === "extra large" &&
							(token.attributes.type !== "screen" ||
								token.attributes.folder !== "size")
						);
					},
					format: "css/variables",
					options: {
						themedFile: true,
						selector: ["@layer lovely-ui-base", ":root"],
					},
				},
			],
		},
		tokens: {
			expand: { include: ["typography"] },
			transformGroup: "js",
			buildPath: `${BASE_BUILD_DIR}/tokens/`,
			transforms: ["dtcg/unitValue"],
			files: FOLDERS_SPLIT.map((folder) => [
				{
					format: "javascript/esm",
					destination: `${folder}.mjs`,
					filter(token) {
						return token.attributes?.folder === folder;
					},
				},
				{
					format: "javascript/module",
					destination: `${folder}.cjs`,
					filter(token) {
						return token.attributes?.folder === folder;
					},
				},
				{
					format: "typescript/module-declarations",
					destination: `${folder}.d.ts`,
					filter(token) {
						return token.attributes?.folder === folder;
					},
				},
			]).flat(),
		},
		js: {
			expand: { include: ["typography"] },
			transformGroup: "js",
			buildPath: `${BASE_BUILD_DIR}/js/`,
			transforms: ["dtcg/unitValue"],
			files: [
				...FOLDERS_SPLIT.map((folder) => [
					{
						format: "javascript/esm",
						destination: `${folder}.mjs`,
						filter(token) {
							return token.attributes?.folder === folder;
						},
						options: { minify: true },
					},
					{
						format: "javascript/cjs-map",
						destination: `${folder}.cjs`,
						filter(token) {
							return token.attributes?.folder === folder;
						},
						options: { minify: true },
					},
					{
						format: "typescript/esm-declarations",
						destination: `${folder}.d.ts`,
						filter(token) {
							return token.attributes?.folder === folder;
						},
						options: { minify: true },
					},
				]).flat(),
				{
					format: "javascript/cjs-index",
					destination: `index.cjs`,
					filter(token) {
						return FOLDERS_SPLIT.includes(token.attributes?.folder);
					},
					options: { minify: true },
				},
				{
					format: "javascript/esm-index",
					destination: `index.mjs`,
					filter(token) {
						return FOLDERS_SPLIT.includes(token.attributes?.folder);
					},
					options: { minify: true },
				},
				{
					format: "typescript/esm-index-declarations",
					destination: `index.d.ts`,
					filter(token) {
						return FOLDERS_SPLIT.includes(token.attributes?.folder);
					},
					options: { minify: true },
				},
			],
		},
	},
};
