import { Injectable } from '@angular/core';

@Injectable()
export class DebugService {
	constructor() {
		// const debugMode = true;
		console.log('NODE_ENV', process.env.NODE_ENV);
		const debugMode = process.env.NODE_ENV === 'production';
		console.log = this.override(console.log, debugMode);
		console.warn = this.override(console.warn, debugMode);
		console.error = this.overrideError(console.error, console.warn, debugMode);
		if (debugMode) {
			console.debug = (message?: any, ...optionalParams: any[]) => {
				// Do nothing
			};
			console.trace = (message?: any, ...optionalParams: any[]) => {
				// Do nothing
			};
		}
	}

	private override(oldConsoleLogFunc: any, debugMode: boolean) {
		if (debugMode) {
			return function () {
				let argsString = '';
				const shouldFormat = arguments.length > 0 && arguments[0] !== 'no-format';
				for (let i = 0; i < arguments.length; i++) {
					let cache = [];
					const arg = arguments[i];
					if (!!arg?.includes && arg?.includes('ResizeObserver loop limit exceeded')) {
						continue;
					}
					const argAsString =
						JSON.stringify(arguments[i], function (key, value) {
							if (typeof value === 'object' && value !== null) {
								if (cache.indexOf(value) !== -1) {
									// Circular reference found, discard key
									return;
								}
								// Store value in our collection
								cache.push(value);
							}
							return value;
						}) || '';
					argsString += (shouldFormat ? argAsString.substring(0, 5000) : argAsString) + ' | ';
					cache = null; // Enable garbage collection + " | "
				}
				oldConsoleLogFunc.apply(console, [argsString]);
			};
		}
		return oldConsoleLogFunc;
	}

	private overrideError(oldConsoleLogFunc: any, oldWarnFunc: any, debugMode: boolean) {
		if (debugMode) {
			return function () {
				const stack = new Error().stack;
				// oldConsoleLogFunc.apply(console, arguments, stack);
				let argsString = stack + '\n|';
				for (let i = 0; i < arguments.length; i++) {
					let cache = [];
					const arg = arguments[i];
					if (!!arg?.includes && arg?.includes('ResizeObserver loop limit exceeded')) {
						continue;
					}

					// Extract error details if it's an Error object
					// This is critical because JSON.stringify on Error objects returns {} and loses the stack trace
					let errorDetails = '';
					if (arg instanceof Error) {
						errorDetails =
							`\n[ERROR OBJECT]\n` +
							`Name: ${arg.name}\n` +
							`Message: ${arg.message}\n` +
							`Stack: ${arg.stack || 'No stack trace'}\n` +
							`String: ${String(arg)}\n`;
					}

					const stringified =
						JSON.stringify(arguments[i], function (key, value) {
							// Preserve Error object properties that JSON.stringify normally omits
							if (value instanceof Error) {
								return {
									name: value.name,
									message: value.message,
									stack: value.stack,
									toString: String(value),
								};
							}
							if (typeof value === 'object' && value !== null) {
								if (cache.indexOf(value) !== -1) {
									// Circular reference found, discard key
									return;
								}
								cache.push(value);
							}
							return value;
						}) || '';

					argsString += errorDetails + stringified.substring(0, 1000) + ' | ';
					cache = null; // Enable garbage collection + " | "
				}
				oldWarnFunc.apply(console, ['(ERROR)', argsString]);
				oldConsoleLogFunc.apply(console, arguments);
			};
		}
		return oldConsoleLogFunc;
	}
}
