import { Server } from "@/server";
import { it } from "vitest";

it.todo("empty", () => {
	const app = new Server();

	app.use({
		method: "post",
		path: "/*",
		// eslint-disable-next-line @typescript-eslint/require-await
		handler: async (a) => {
			return {
				code: 200,
				body: a,
			};
		},
	});

	app.serve({
		port: 3672,
	});
});
