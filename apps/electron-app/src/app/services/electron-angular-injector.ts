import { InjectFlags, InjectionToken, InjectOptions, Injector, ProviderToken } from '@angular/core';
import { electronAppInjector, Token } from './electron-app-injector';

/**
 * Mock Angular Injector that wraps ElectronAppInjector
 * This allows us to use the existing setAppInjector function
 */
export class ElectronAngularInjector implements Injector {
	get<T>(token: ProviderToken<T>, notFoundValue: undefined, options: InjectOptions & { optional?: false }): T;
	get<T>(token: ProviderToken<T>, notFoundValue: null, options: InjectOptions): T;
	get<T>(token: ProviderToken<T>, notFoundValue?: T, options?: InjectOptions | InjectFlags): T;
	get<T>(token: any, notFoundValue?: any, options?: any): T {
		// Check if token exists in electronAppInjector (handles both Type and InjectionToken)
		if (electronAppInjector.has(token)) {
			return electronAppInjector.get(token);
		}

		// Handle not found cases
		if (notFoundValue !== undefined) {
			return notFoundValue;
		}

		const tokenName =
			token instanceof InjectionToken
				? token.toString()
				: typeof token === 'function'
					? token.name
					: token.toString();
		throw new Error(`No provider for ${tokenName}!`);
	}

	/**
	 * Register a service with the underlying ElectronAppInjector
	 * Supports both Type<T> and InjectionToken<T>
	 */
	register<T>(token: Token<T>, instance: T): void {
		electronAppInjector.register(token, instance);
	}
}
