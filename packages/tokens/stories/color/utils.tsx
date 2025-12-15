import { ColorItem, Markdown } from "@storybook/addon-docs/blocks";
import { ReactNode } from "react";

// @ts-ignore
import colors from "../../dist/js/color";

const { base } = colors.color;

export enum AttributeType {
	/** Folder grouping */
	FOLDER = `folder`,
	/** Top level kind (e.g. semantic) */
	TOKEN = `token`,
	/** Type of token (e.g. background) */
	TYPE = `type`,
	/** Kind of item (e.g. component) */
	KIND = `kind`,
	/** Item (e.g. page) */
	ITEM = `item`,
	/** Style of item (e.g. primary, callout) */
	STYLE = `style`,
	/** Variant of item (e.g. 100) */
	VARIANT = `variant`,
	/** Screen size (e.g. small screen) */
	SCREEN = `screen`,
	/** Theme or mode (e.g. light) */
	THEME = `theme`,
	/** Semantic meaning (e.g. destructive) */
	MEANING = `meaning`,
	/** State of item (e.g. active) */
	STATE = `state`,
	/** Attribute of item (e.g. padding) */
	ATTRIBUTE = `attribute`,
	/** Value or scale (e.g. x) */
	VALUE = `value`,
}

type ColorInfo = {
	title: string;
	subtitle: string;
	colors: Record<string, string>;
};

export function getBaseColors() {
	let coreTokenSet: ColorInfo["colors"] = {};
	const colorMap: ColorInfo[] = [
		{
			title: "Neutrals",
			subtitle: "base.<name>",
			colors: coreTokenSet,
		},
	];
	for (const [name, value] of Object.entries(base)) {
		if (typeof value === "string") {
			// We have an actual token
			coreTokenSet[name] = value;
		} else {
			// We have a token set
			colorMap.push({
				title: name
					.split(" ")
					.map((s) => s.at(0)?.toUpperCase() + s.substring(1))
					.join(" "),
				subtitle: `base.${name}.<shade>`,
				colors: value as Record<string, string>,
			});
		}
	}

	return colorMap;
}

type ColorTree = { [key: string]: string | ColorTree };

export function flattenColorPallete(tree: ColorTree) {
	const items: Record<string, string> = {};
	const traverse = (node: ColorTree, path: string[]) => {
		for (const [key, value] of Object.entries(node)) {
			if (typeof value === "string") {
				items[path.concat([key]).join("-")] = value;
			} else {
				traverse(value, path.concat([key]));
			}
		}
	};
	traverse(tree, []);
	return items;
}

export function getColorTreeDepth(tree: ColorTree): number {
	let maxDepth = 0;
	const traverse = (node: ColorTree, depth: number) => {
		for (const value of Object.values(node)) {
			if (typeof value === "string") {
				if (depth > maxDepth) {
					maxDepth = depth;
				}
			} else {
				traverse(value, depth + 1);
			}
		}
	};
	traverse(tree, 1);
	return maxDepth;
}

const groupingKeys = ["light", "dark", "subtle", "bold"];

export function semanticColorPaletteDisplay(
	tree: ColorTree,
	level = 3,
	prefix = "",
): ReactNode {
	return Object.entries(tree).map(([key, value]) => {
		if (typeof value === "string") {
			return null;
		} else if (Object.keys(value).every((key) => groupingKeys.includes(key))) {
			return (
				<ColorItem
					key={key}
					title={key[0].toUpperCase() + key.substring(1)}
					subtitle={`--lovely-ui-color-semantic-${prefix}-${key}`}
					colors={flattenColorPallete(value)}
				/>
			);
		} else {
			return (
				<>
					<Markdown>{`${"#".repeat(level)} ${key[0].toUpperCase() + key.substring(1)}`}</Markdown>
					{semanticColorPaletteDisplay(value, level + 1, `${prefix}-${key}`)}
				</>
			);
		}
	});
}
