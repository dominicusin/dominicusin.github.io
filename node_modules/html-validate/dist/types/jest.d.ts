export { }



import { type ConfigData } from "./index"
import { type Message } from "./index"
declare module "expect" {
    interface Matchers<R, T> {
        toBeValid(): R;
        toBeInvalid(): R;
        toHaveError(error: Partial<Message>): R;
        toHaveError(ruleId: string, message: unknown, context?: unknown): R;
        toHaveErrors(errors: Array<[string, unknown] | Record<string, unknown>>): R;
        /**
         * Validate string or HTMLElement.
         *
         * Test passes if result is valid.
         *
         * @param config - Optional HTML-Validate configuration object.
         * @param filename - Optional filename used when matching transformer and
         * loading configuration.
         */
        toHTMLValidate(filename?: string): R;
        toHTMLValidate(config: ConfigData, filename?: string): R;
        toHTMLValidate(error: Partial<Message>, filename?: string): R;
        toHTMLValidate(error: Partial<Message>, config: ConfigData, filename?: string): R;
        /**
         * Writes out the given [[Report]] using codeframe formatter and compares
         * with snapshot.
         */
        toMatchCodeframe(snapshot?: string): R;
        /**
         * Writes out the given [[Report]] using codeframe formatter and compares
         * with inline snapshot.
         */
        toMatchInlineCodeframe(snapshot?: string): R;
    }
}
declare global {
    namespace jest {
        interface Matchers<R, T = {}> {
            toBeValid(): R;
            toBeInvalid(): R;
            toHaveError(error: Partial<Message>): R;
            toHaveError(ruleId: string, message: unknown, context?: unknown): R;
            toHaveErrors(errors: Array<[string, unknown] | Record<string, unknown>>): R;
            /**
             * Validate string or HTMLElement.
             *
             * Test passes if result is valid.
             *
             * @param config - Optional HTML-Validate configuration object.
             * @param filename - Optional filename used when matching transformer and
             * loading configuration.
             */
            toHTMLValidate(filename?: string): R;
            toHTMLValidate(config: ConfigData, filename?: string): R;
            toHTMLValidate(error: Partial<Message>, filename?: string): R;
            toHTMLValidate(error: Partial<Message>, config: ConfigData, filename?: string): R;
            /**
             * Writes out the given [[Report]] using codeframe formatter and compares
             * with snapshot.
             */
            toMatchCodeframe(snapshot?: string): R;
            /**
             * Writes out the given [[Report]] using codeframe formatter and compares
             * with inline snapshot.
             */
            toMatchInlineCodeframe(snapshot?: string): R;
        }
    }
}
