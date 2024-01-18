import type { VitestEnvironment } from "vitest";
import { defineWorkspace } from "vitest/config";

function project(root: string, environment: VitestEnvironment = "node") {
	return {
		extends: "./vitest.config.ts",
		test: {
			name: `${root}:${environment}`,
			environment,
			include: [`packages/${root}/test/**/*.spec.ts`],
		},
	};
}

export default defineWorkspace([
	project("client"),
	project("client", "happy-dom"),
	project("functions"),
	project("graphql"),
	project("graphql", "happy-dom"),
	project("rest"),
	project("rest", "happy-dom"),
]);
