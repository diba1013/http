import { version } from "./package.json";
import { defineConfig } from "@diba1013/tscz";

export default defineConfig({
	name: "rest",
	entries: [
		{
			input: "src/index.ts",
			output: ["cjs", "esm", "dts"],
			name: "index",
		},
	],
	env: {
		__VERSION__: version,
	},
});
