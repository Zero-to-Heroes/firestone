import { ChangeDetectorRef, Injectable } from '@angular/core';
import { Preferences } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';

/**
 * @deprecated Use the common abstract component, and add more data as needed
 */
@Injectable()
export abstract class AbstractSubscriptionStoreComponent extends AbstractSubscriptionComponent {
	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	/** @deprecated use PreferencesService.preferences$$ instead */
	/** Replacing it with preferences.preferences$$ here doesn't work, because we need to await for the prefs
	 * to be ready first
	 */
	protected listenForBasicPref$<T>(selector: (prefs: Preferences) => T, ...logArgs: any[]) {
		return this.store.listenPrefs$((prefs) => selector(prefs)).pipe(this.mapData(([pref]) => pref));
	}
}
