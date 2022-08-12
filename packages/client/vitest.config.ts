// eslint-disable-next-line spaced-comment
/// <reference types="vitest" />
import { defineConfig } from "vite";

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
			all: true,
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.types.ts"],
			reporter: ["html", "text-summary", "lcovonly"],
		},
	},
});
