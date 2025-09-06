import { ChangeDetectorRef, Optional } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

export interface FilterUrlConfig<T, TPrefs = any> {
	paramName: string;
	preferencePath: keyof TPrefs;
	validValues?: T[];
	defaultValue?: T;
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
				const typedValue = paramValue as T;

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

		// Add parameter if it's not the default value, or set to null to remove it
		if (value && value !== defaultValue) {
			queryParams[this.filterConfig.paramName] = value;
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
