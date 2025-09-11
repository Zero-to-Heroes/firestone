import { Type } from '@angular/core';

/**
 * Simple dependency injection container for Electron environment
 * Allows manual registration and retrieval of service instances
 */
export class ElectronAppInjector {
	private static instance: ElectronAppInjector;
	private services = new Map<string, any>();
	private serviceTypes = new Map<Type<any>, string>();

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
	register<T>(serviceType: Type<T>, instance: T): void {
		const key = this.getServiceKey(serviceType);
		this.services.set(key, instance);
		this.serviceTypes.set(serviceType, key);
		console.log(`🔧 Registered service: ${serviceType.name}`);
	}

	/**
	 * Retrieve a service instance from the injector
	 */
	get<T>(serviceType: Type<T>): T {
		const key = this.serviceTypes.get(serviceType);
		if (!key) {
			throw new Error(`Service ${serviceType.name} not found. Make sure it's registered first.`);
		}

		const instance = this.services.get(key);
		if (!instance) {
			throw new Error(`Service instance for ${serviceType.name} not found.`);
		}

		return instance;
	}

	/**
	 * Check if a service is registered
	 */
	has<T>(serviceType: Type<T>): boolean {
		return this.serviceTypes.has(serviceType);
	}

	/**
	 * Clear all registered services
	 */
	clear(): void {
		this.services.clear();
		this.serviceTypes.clear();
		console.log('🧹 Cleared all registered services');
	}

	/**
	 * Get all registered service names for debugging
	 */
	getRegisteredServices(): string[] {
		return Array.from(this.serviceTypes.keys()).map((type) => type.name);
	}

	private getServiceKey<T>(serviceType: Type<T>): string {
		return serviceType.name || serviceType.toString();
	}
}

/**
 * Global instance for easy access
 */
export const electronAppInjector = ElectronAppInjector.getInstance();
