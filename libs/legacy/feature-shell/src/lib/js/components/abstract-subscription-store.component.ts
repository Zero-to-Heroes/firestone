import { ChangeDetectorRef, Injectable } from '@angular/core';
import { AbstractSubscriptionComponent } from '@components/abstract-subscription.component';
import { Preferences } from '../models/preferences';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';

@Injectable()
export abstract class AbstractSubscriptionStoreComponent extends AbstractSubscriptionComponent {
	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	protected listenForBasicPref$<T>(selector: (prefs: Preferences) => T, ...logArgs: any[]) {
		return this.store.listenPrefs$((prefs) => selector(prefs)).pipe(this.mapData(([pref]) => pref));
	}
}
