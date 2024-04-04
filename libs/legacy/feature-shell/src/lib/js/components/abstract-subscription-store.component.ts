import { ChangeDetectorRef, Injectable } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AppInjector } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';

/**
 * @deprecated Use the common abstract component, and add more data as needed
 */
@Injectable()
export abstract class AbstractSubscriptionStoreComponent extends AbstractSubscriptionComponent {
	private readonly _prefs: PreferencesService;

	constructor(store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(cdr);
		this._prefs = AppInjector.get(PreferencesService);
	}

	/** @deprecated use PreferencesService.preferences$() instead */
	protected listenForBasicPref$<T>(selector: (prefs: Preferences) => T, ...logArgs: any[]) {
		return this._prefs.preferences$$.pipe(this.mapData((prefs) => selector(prefs)));
	}
}
