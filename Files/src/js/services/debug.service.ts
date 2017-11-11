import { Injectable } from '@angular/core';

import * as Raven from 'raven-js';

@Injectable()
export class DebugService {

	constructor() {
		let oldConsoleLogFunc = console.log;
		let debugMode = true;
		if (debugMode) {
			console.log = function() {
				let argsString = "";
				for (let i = 0; i < arguments.length; i++) {
					let cache = [];
					argsString += (JSON.stringify(arguments[i], function(key, value) {
						if (typeof value === 'object' && value !== null) {
							if (cache.indexOf(value) !== -1) {
								// Circular reference found, discard key
								return;
							}
							// Store value in our collection
							cache.push(value);
						}
						return value;
					}) || '').substring(0, 1000) + ' | ';
					cache = null; // Enable garbage collection + " | "
				}
				oldConsoleLogFunc.apply(console, [argsString]);
			};
		}
	}
}




