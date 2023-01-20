import { Injectable } from '@angular/core';

declare let amplitude;

@Injectable()
export class DebugService {
	constructor() {
		// const debugMode = true;
		const debugMode = process.env.NODE_ENV === 'production';
		console.log = this.override(console.log, debugMode);
		console.warn = this.override(console.warn, debugMode);
		console.error = this.overrideError(console.error, console.warn, debugMode);
		if (debugMode) {
			console.debug = (message?: any, ...optionalParams: any[]) => {
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
					argsString += (shouldFormat ? argAsString.substring(0, 1000) : argAsString) + ' | ';
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
				// Sampling of events
				if (Math.random() < 0.001) {
					amplitude.getInstance().logEvent('error-logged');
				}
				const stack = new Error().stack;
				// oldConsoleLogFunc.apply(console, arguments, stack);
				let argsString = stack + '\n|';
				for (let i = 0; i < arguments.length; i++) {
					let cache = [];
					argsString +=
						(
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
							}) || ''
						).substring(0, 1000) + ' | ';
					cache = null; // Enable garbage collection + " | "
				}
				// So that errors are only reported once by Sentry
				oldWarnFunc.apply(console, ['(ERROR)', argsString]);
				oldConsoleLogFunc.apply(console, arguments);
			};
		}
		return oldConsoleLogFunc;
	}
}
