import { InjectFlags, InjectOptions, Injector, ProviderToken, Type } from '@angular/core';
import { electronAppInjector } from './electron-app-injector';

/**
 * Mock Angular Injector that wraps ElectronAppInjector
 * This allows us to use the existing setAppInjector function
 */
export class ElectronAngularInjector implements Injector {
	get<T>(token: ProviderToken<T>, notFoundValue: undefined, options: InjectOptions & { optional?: false }): T;
	get<T>(token: ProviderToken<T>, notFoundValue: null, options: InjectOptions): T;
	get<T>(token: ProviderToken<T>, notFoundValue?: T, options?: InjectOptions | InjectFlags): T;
	get<T>(token: any, notFoundValue?: any, options?: any): T {
		// Handle Type tokens
		if (typeof token === 'function' && electronAppInjector.has(token)) {
			return electronAppInjector.get(token);
		}

		// Handle other token types or not found cases
		if (notFoundValue !== undefined) {
			return notFoundValue;
		}

		const tokenName = typeof token === 'function' ? token.name : token.toString();
		throw new Error(`No provider for ${tokenName}!`);
	}

	/**
	 * Register a service with the underlying ElectronAppInjector
	 */
	register<T>(serviceType: Type<T>, instance: T): void {
		electronAppInjector.register(serviceType, instance);
	}
}
