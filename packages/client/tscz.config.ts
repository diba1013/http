import { Config, defineConfig, Platform } from "@diba1013/tscz";
import { version } from "./package.json";

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
		define: {
			__VERSION__: version,
			__ENVIRONMENT__: environment,
		},
	};
}

export default defineConfig([entry("browser"), entry("node")]);
