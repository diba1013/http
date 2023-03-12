import { configure } from "urlcat";
import type { RequestParameters } from "@/global.types";

const concatenate = configure({});

export function url(base?: string, path = "/", parameters: RequestParameters = {}): string {
	return base === undefined ? concatenate(path, parameters) : concatenate(base, path, parameters);
}
