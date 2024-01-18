import alias from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [alias()],
	test: {
		environment: "node",
		restoreMocks: true,
		coverage: {
			enabled: true,
			all: true,
			provider: "v8",
			include: ["packages/**/src/**/*.ts"],
			exclude: ["packages/**/src/**/*.types.ts"],
			reporter: ["html", "text-summary", "lcovonly"],
		},
	},
});
