import { Inject, InjectionToken, Type } from '@angular/core';

/**
 * Token type that can be either a class Type (including abstract classes), or an InjectionToken
 *
 * Note: TypeScript interfaces cannot be used as DI tokens at runtime.
 * - For abstract classes (like ILocalizationService), use the class directly
 * - For actual TypeScript interfaces, use InjectionToken<T>
 *
 * Example:
 * ```typescript
 * // Abstract class (works directly)
 * electronInjector.register(ILocalizationService, instance);
 *
 * // Interface (must use InjectionToken)
 * const MY_INTERFACE_TOKEN = new InjectionToken<IMyInterface>('IMyInterface');
 * electronInjector.register(MY_INTERFACE_TOKEN, instance);
 * ```
 */
export type Token<T> = Type<T> | InjectionToken<T> | (abstract new (...args: any[]) => T);

/**
 * Metadata keys used by TypeScript and Angular
 * - design:paramtypes: TypeScript stores parameter types here (requires emitDecoratorMetadata: true)
 * - parameters: Angular stores parameter decorators here (array of decorator arrays)
 */
const PARAM_TYPES = 'design:paramtypes';
const PARAM_DECORATORS = 'parameters'; // Angular stores parameter decorators here

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
	 *
	 * Supports:
	 * - Concrete classes: `register(MyService, instance)`
	 * - Abstract classes: `register(ILocalizationService, instance)`
	 * - InjectionTokens: `register(MY_TOKEN, instance)`
	 *
	 * Note: TypeScript interfaces must use InjectionToken, not the interface directly
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
	 * Automatically instantiate a class with constructor injection
	 *
	 * Supports:
	 * - Type-based injection: `instantiate(MyService)` - uses parameter types
	 * - @Inject decorator: `@Inject(TOKEN) private service: IService` - uses the token
	 * - Mixed: Some parameters with @Inject, others without
	 *
	 * Example:
	 * ```typescript
	 * class MyService {
	 *   constructor(
	 *     private cards: CardsFacadeService,
	 *     @Inject(ADS_SERVICE_TOKEN) private ads: IAdsService
	 *   ) {}
	 * }
	 *
	 * const instance = electronInjector.instantiate(MyService);
	 * ```
	 *
	 * @param type The class to instantiate
	 * @returns A new instance of the class with dependencies injected
	 * @throws Error if any dependency is not registered
	 */
	instantiate<T>(type: Type<T>): T {
		const paramTypes = this.getParamTypes(type);
		const injectTokens = this.getInjectTokens(type);

		// Resolve all constructor parameters
		const dependencies = paramTypes.map((paramType, index) => {
			// Check if @Inject decorator was used for this parameter
			const injectToken = injectTokens?.[index];
			const token = injectToken !== undefined ? injectToken : paramType;

			// Handle undefined/null types (optional parameters or primitives)
			if (token === undefined || token === null) {
				throw new Error(
					`Cannot resolve parameter ${index} of ${type.name}. ` +
						`Type is ${token === undefined ? 'undefined' : 'null'}. ` +
						`Use @Inject() with an InjectionToken for interfaces or optional parameters.`,
				);
			}

			// Resolve the dependency
			if (!this.services.has(token)) {
				const tokenName = this.getTokenName(token);
				throw new Error(
					`Cannot resolve parameter ${index} (${tokenName}) of ${type.name}. ` +
						`Make sure the service is registered first.`,
				);
			}

			return this.services.get(token);
		});

		// Create and return the instance
		return new type(...dependencies);
	}

	/**
	 * Get constructor parameter types from TypeScript metadata
	 */
	private getParamTypes<T>(type: Type<T>): any[] {
		// Read design:paramtypes metadata (requires emitDecoratorMetadata: true)
		return (Reflect.getMetadata(PARAM_TYPES, type) || []) as any[];
	}

	/**
	 * Get @Inject tokens from Angular metadata
	 * Angular stores parameter decorators in the 'parameters' metadata key
	 * Structure: [[[DecoratorClass, [args...]], ...], ...] - array of parameters, each with array of decorators
	 */
	private getInjectTokens<T>(type: Type<T>): (Token<any> | undefined)[] | undefined {
		// Angular stores parameter decorators in the 'parameters' metadata key
		// It's an array of arrays, where each inner array contains decorator metadata for that parameter
		const paramDecorators = Reflect.getMetadata(PARAM_DECORATORS, type) as any[][] | undefined;

		if (!paramDecorators) {
			return undefined;
		}

		// Extract @Inject tokens from decorators
		// Angular's structure: [[[Inject, [token]], ...], ...]
		return paramDecorators.map((decorators) => {
			if (!decorators || decorators.length === 0) {
				return undefined;
			}

			// Find the @Inject decorator
			// Each decorator is stored as [DecoratorClass, [args...]]
			for (const decorator of decorators) {
				if (Array.isArray(decorator) && decorator.length >= 2) {
					const [decoratorType, args] = decorator;
					// Check if it's the Inject decorator and extract the token
					if (decoratorType === Inject && Array.isArray(args) && args.length > 0) {
						return args[0] as Token<any>;
					}
				}
			}

			return undefined;
		});
	}

	/**
	 * Get a readable name for a token (Type, abstract class, or InjectionToken)
	 */
	private getTokenName<T>(token: Token<T>): string {
		if (token instanceof InjectionToken) {
			return token.toString();
		}
		// Handle both concrete and abstract classes
		if (typeof token === 'function') {
			return (token as Function).name || token.toString();
		}
		return String(token);
	}
}

/**
 * Global instance for easy access
 */
export const electronAppInjector = ElectronAppInjector.getInstance();
