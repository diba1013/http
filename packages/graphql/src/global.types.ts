import { Credentials, RequestParameters } from "@diba1013/fetch";

export type { Credentials, RequestParameters, RequestParameter } from "@diba1013/fetch";

export type GraphRequest = {
	query: string;
	variables?: RequestParameters;
};

export type GraphResponse<T = unknown> = {
	data?: T;
	errors?: GraphError[];
	extensions?: RequestParameters;
};

export type GraphError = {
	message: string;
	locations?: DocumentLoccation[];
	path: GraphPath;
	extensions: RequestParameters;
};

export type DocumentLoccation = {
	line: number;
	column: number;
};

export type GraphPath = (string | number)[];

export type GraphClientOptions = {
	url: string;
	credentials?: Credentials;
};

export interface GraphClient {
	execute<T>(request: GraphRequest): Promise<T>;
}
