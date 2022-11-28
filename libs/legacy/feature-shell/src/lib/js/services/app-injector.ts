import { Injector } from '@angular/core';

/**
 * Allows for retrieving singletons using `AppInjector.get(MyService)` (whereas
 * `ReflectiveInjector.resolveAndCreate(MyService)` would create a new instance
 * of the service).
 */
export let AppInjector: Injector;

/**
 * Helper to set the exported {@link AppInjector}, needed as ES6 modules export
 * immutable bindings (see http://2ality.com/2015/07/es6-module-exports.html) for
 * which trying to make changes after using `import {AppInjector}` would throw:
 * "TS2539: Cannot assign to 'AppInjector' because it is not a variable".
 */
// See https://stackoverflow.com/questions/39409328/storing-injector-instance-for-use-in-components
export function setAppInjector(injector: Injector) {
	if (AppInjector) {
		// Should not happen
		console.error('Programming error: AppInjector was already set');
	} else {
		AppInjector = injector;
	}
}
