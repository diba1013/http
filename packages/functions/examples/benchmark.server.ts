// Benchmark based on https://github.com/the-benchmarker/web-frameworks

// pnpx tsx examples/benchmark.server.ts
// docker run --net=host --rm actions/wrk -H 'Connection: keep-alive' --connections 64 --threads 12 --duration 15 --timeout 1 http://localhost:3000/user/0/?namespace=funny
import { App } from "@diba1013/functions";

const app = new App();

app.get("/", () => {
	// Ignore, default response
});

app.get<{ id: string }>("/user/:id/", ({ context }) => {
	const { id } = context.params();
	return {
		body: id,
	};
});

app.post("/user/", () => {
	return {};
});

app.listen({
	port: 3000,
});
