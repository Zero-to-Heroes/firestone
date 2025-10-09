import { InjectionToken, Type } from '@angular/core';

/**
 * Token type that can be either a class Type or an InjectionToken
 */
export type Token<T> = Type<T> | InjectionToken<T>;

/**
 * Simple dependency injection container for Electron environment
 * Allows manual registration and retrieval of service instances
 * Supports both Type<T> and InjectionToken<T> tokens
 */
export class ElectronAppInjector {
	private static instance: ElectronAppInjector;
	private services = new Map<any, any>();

	private constructor() {}

	static getInstance(): ElectronAppInjector {
		if (!ElectronAppInjector.instance) {
			ElectronAppInjector.instance = new ElectronAppInjector();
		}
		return ElectronAppInjector.instance;
	}

	/**
	 * Register a service instance with the injector
	 */
	register<T>(token: Token<T>, instance: T): void {
		this.services.set(token, instance);
		const tokenName = this.getTokenName(token);
		console.log(`🔧 Registered service: ${tokenName}`);
	}

	/**
	 * Retrieve a service instance from the injector
	 */
	get<T>(token: Token<T>): T {
		if (!this.services.has(token)) {
			const tokenName = this.getTokenName(token);
			throw new Error(`Service ${tokenName} not found. Make sure it's registered first.`);
		}

		return this.services.get(token);
	}

	/**
	 * Check if a service is registered
	 */
	has<T>(token: Token<T>): boolean {
		return this.services.has(token);
	}

	/**
	 * Clear all registered services
	 */
	clear(): void {
		this.services.clear();
		console.log('🧹 Cleared all registered services');
	}

	/**
	 * Get all registered service names for debugging
	 */
	getRegisteredServices(): string[] {
		return Array.from(this.services.keys()).map((token) => this.getTokenName(token));
	}

	/**
	 * Get a readable name for a token (Type or InjectionToken)
	 */
	private getTokenName<T>(token: Token<T>): string {
		if (token instanceof InjectionToken) {
			return token.toString();
		}
		return (token as Type<T>).name || token.toString();
	}
}

/**
 * Global instance for easy access
 */
export const electronAppInjector = ElectronAppInjector.getInstance();
