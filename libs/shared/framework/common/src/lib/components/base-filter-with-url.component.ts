import { ChangeDetectorRef, Optional } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

/**
 * Helper function to parse array values from URL parameters.
 * Handles both comma-separated strings and arrays of strings from Angular Router.
 * @param value - The raw value from URL params (string or string[])
 * @param parseItem - Function to parse each individual item from string to the target type
 * @param validateItem - Optional function to validate each parsed item
 * @param emptyValue - Value to return when no valid items are found (default: [])
 * @returns Parsed array of items
 */
export function parseArrayUrlParam<T>(
	value: string | string[],
	parseItem: (item: string) => T | null,
	validateItem?: (item: T) => boolean,
	emptyValue: T[] = [] as T[],
): readonly T[] {
	// Handle both string and string[] (Angular Router can return either)
	// If it's an array, Angular Router likely serialized as ?param=1&param=2&param=3
	// If it's a string, Angular Router likely serialized as ?param=1,2,3
	const valuesToParse = Array.isArray(value) ? value : [value];
	if (
		valuesToParse.length === 0 ||
		(valuesToParse.length === 1 && (!valuesToParse[0] || valuesToParse[0].trim() === ''))
	) {
		return emptyValue;
	}

	// Flatten: if array contains comma-separated strings, split them; otherwise use as-is
	const allValues = valuesToParse.flatMap((v) => v.split(',').map((item) => item.trim())).filter((v) => v);

	// Parse each value
	const parsed = allValues
		.map((v) => parseItem(v))
		.filter((v): v is T => v !== null && (validateItem ? validateItem(v) : true));

	return parsed.length > 0 ? parsed : emptyValue;
}

/**
 * Helper function to parse numeric array values from URL parameters.
 * @param value - The raw value from URL params (string or string[])
 * @param min - Optional minimum value for validation
 * @param max - Optional maximum value for validation
 * @param emptyValue - Value to return when no valid items are found (default: null)
 * @returns Parsed array of numbers or emptyValue
 */
export function parseNumericArrayUrlParam<T extends number>(
	value: string | string[],
	min?: number,
	max?: number,
	emptyValue: T[] | null = null,
): readonly T[] | null {
	return parseArrayUrlParam<T>(
		value,
		(v) => {
			const numValue = parseInt(v, 10);
			if (isNaN(numValue)) {
				return null;
			}
			if (min !== undefined && numValue < min) {
				return null;
			}
			if (max !== undefined && numValue > max) {
				return null;
			}
			return numValue as T;
		},
		undefined,
		emptyValue ?? [],
	);
}

export interface FilterUrlConfig<T, TPrefs = any> {
	paramName: string;
	preferencePath: keyof TPrefs;
	validValues?: T[];
	defaultValue?: T;
	/**
	 * Optional parser function to convert URL parameter string to the expected type T.
	 * URL parameters are always strings, so this is needed for non-string types (numbers, arrays, etc.)
	 * @param value - The raw value from URL params (string or string[] depending on Angular Router behavior)
	 * @returns The parsed value of type T
	 */
	parseUrlParam?: (value: string | string[]) => T;
}

export interface PreferencesServiceLike<TPrefs = any> {
	preferences$$: any; // BehaviorSubject or similar
	updatePrefs(path: keyof TPrefs, value: any): Promise<void>;
}

export abstract class BaseFilterWithUrlComponent<T, TPrefs = any> extends AbstractSubscriptionComponent {
	protected abstract filterConfig: FilterUrlConfig<T, TPrefs>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected readonly prefs: PreferencesServiceLike<TPrefs>,
		@Optional() protected readonly route: ActivatedRoute,
		@Optional() protected readonly router: Router,
		protected readonly defaultPrefs: TPrefs,
	) {
		super(cdr);
	}

	protected initializeUrlSync(): void {
		// Initialize from URL parameters
		this.initializeFromUrlParams();

		// Set up URL parameter synchronization
		this.setupUrlParamSync();
	}

	private initializeFromUrlParams(): void {
		this.route?.queryParams.pipe(take(1)).subscribe(async (params) => {
			const paramValue = params[this.filterConfig.paramName];
			if (paramValue) {
				// Use custom parser if provided, otherwise cast directly (for string types)
				const typedValue = this.filterConfig.parseUrlParam
					? this.filterConfig.parseUrlParam(paramValue)
					: (paramValue as T);

				// Validate the value if validValues are specified
				if (this.filterConfig.validValues && !this.filterConfig.validValues.includes(typedValue)) {
					console.warn(`[${this.filterConfig.paramName}] Invalid URL parameter value:`, typedValue);
					return;
				}

				await this.prefs.updatePrefs(this.filterConfig.preferencePath, typedValue);
				console.debug(`[${this.filterConfig.paramName}] updated from URL:`, typedValue);
			}
		});
	}

	private setupUrlParamSync(): void {
		// Watch for preference changes and update URL
		this.prefs.preferences$$
			.pipe(this.mapData((prefs: TPrefs) => prefs[this.filterConfig.preferencePath] as T))
			.subscribe((value) => {
				this.updateUrlParam(value);
			});
	}

	private updateUrlParam(value: T): void {
		if (!this.route || !this.router) {
			return;
		}
		const defaultValue =
			this.filterConfig.defaultValue ?? (this.defaultPrefs[this.filterConfig.preferencePath] as T);

		const queryParams: any = {};

		// Check if value is empty (empty array or falsy)
		const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
		
		// Add parameter if it's not empty and not the default value, or set to null to remove it
		if (!isEmpty && value !== defaultValue) {
			// Serialize arrays as comma-separated strings for consistent behavior
			// Angular Router would otherwise serialize arrays as multiple query parameters
			if (Array.isArray(value)) {
				queryParams[this.filterConfig.paramName] = value.join(',');
			} else {
				queryParams[this.filterConfig.paramName] = value;
			}
		} else {
			queryParams[this.filterConfig.paramName] = null;
		}

		// Update URL without triggering navigation
		this.router.navigate([], {
			relativeTo: this.route,
			queryParams,
			queryParamsHandling: 'merge',
			replaceUrl: true,
		});

		console.debug(`[${this.filterConfig.paramName}] updated URL param:`, queryParams);
	}
}
