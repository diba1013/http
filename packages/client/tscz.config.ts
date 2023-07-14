import { version } from "./package.json";
import { Config, Platform, defineConfig } from "@diba1013/tscz";

function entry(environment: Platform): Config {
	return {
		name: "fetch",
		platform: environment,
		entries: [
			{
				input: `src/api/${environment}.api.ts`,
				output: ["cjs", "esm", "dts"],
				name: environment,
			},
		],
		env: {
			__VERSION__: version,
			__ENVIRONMENT__: environment,
		},
	};
}

export default defineConfig([entry("browser"), entry("node")]);
