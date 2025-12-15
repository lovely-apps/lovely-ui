import StyleDictionary from "style-dictionary";

import Mixin from "./mixin.mjs";

export function registerAll() {
	StyleDictionary.registerFormat(Mixin);
}
