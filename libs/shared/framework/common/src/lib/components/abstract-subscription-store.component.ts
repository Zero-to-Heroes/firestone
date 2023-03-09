import { ChangeDetectorRef, Injectable } from '@angular/core';
import { IPreferences } from '../models/preferences';
import { Store } from '../services/app-ui-store.service';
import { AbstractSubscriptionComponent } from './abstract-subscription.component';

@Injectable()
export abstract class AbstractSubscriptionStoreComponent extends AbstractSubscriptionComponent {
	constructor(protected readonly store: Store<IPreferences>, protected override readonly cdr: ChangeDetectorRef) {
		super(cdr);
	}

	protected listenForBasicPref$<T>(selector: (prefs: IPreferences) => T, ...logArgs: any[]) {
		return this.store.listenPrefs$((prefs) => selector(prefs)).pipe(this.mapData(([pref]) => pref));
	}
}
