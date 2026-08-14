import type { ErrorObject } from "ajv";

export interface IOutputError {
	start: { line: number; column: number; offset: number };
	// Optional for required
	end?: { line: number; column: number; offset: number };
	error: string;
	suggestion?: string;
}

/**
 * Color functions applied to CLI output.
 * Each key is optional; omitted keys default to a passthrough `(text) => text` function.
 */
export interface IColors {
	/** Wraps error message lines. Typically a red color. */
	error?(this: void, text: string): string;
	/** Wraps property and value names highlighted in code frames. Typically a magenta color. */
	property?(this: void, text: string): string;
	/** Wraps error type labels such as `ENUM` or `REQUIRED`. Typically bold intensity. */
	bold?(this: void, text: string): string;
}

export interface IInputOptions {
	format?: "cli" | "js";
	indent?: number | null;

	/** Raw JSON used when highlighting error location */
	json?: string | null;

	/** Color functions for CLI output. Each key is optional; missing keys default to a passthrough function. */
	colors?: IColors;
}

export default function <S, T, Options extends IInputOptions>(
	schema: S,
	data: T,
	errors: Array<ErrorObject>,
	options?: Options,
): Options extends { format: "js" } ? Array<IOutputError> : string;
