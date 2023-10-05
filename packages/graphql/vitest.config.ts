import { defineConfig } from "vitest/config";

export default defineConfig({
	resolve: {
		alias: {
			"@": "/src",
		},
	},
	test: {
		environment: "node",
		restoreMocks: true,
		coverage: {
			enabled: true,
			all: true,
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.types.ts"],
			reporter: ["html", "text-summary", "lcovonly"],
		},
	},
});
