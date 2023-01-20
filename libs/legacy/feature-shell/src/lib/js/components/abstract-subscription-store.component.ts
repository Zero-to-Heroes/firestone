import { ChangeDetectorRef, HostListener, Injectable, OnDestroy, ViewRef } from '@angular/core';
import { Observable, pipe, Subject, UnaryFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { Preferences } from '../models/preferences';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { arraysEqual } from '../services/utils';

@Injectable()
export abstract class AbstractSubscriptionStoreComponent implements OnDestroy {
	protected destroyed$ = new Subject<void>();

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}

	protected listenForBasicPref$<T>(selector: (prefs: Preferences) => T, ...logArgs: any[]) {
		return this.store.listenPrefs$((prefs) => selector(prefs)).pipe(this.mapData(([pref]) => pref));
	}

	protected mapData<T, R>(
		extractor: (arg: T) => R,
		equality = null,
		debounceTimeMs = 100,
	): UnaryFunction<Observable<T>, Observable<R>> {
		return pipe(
			debounceTime(debounceTimeMs),
			distinctUntilChanged(equality ?? ((a, b) => arraysEqual(a, b))),
			map(extractor),
			distinctUntilChanged(equality ?? ((a, b) => arraysEqual(a, b))),
			tap((filter) =>
				setTimeout(() => {
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}, 0),
			),
			// share(), // TODO: test this when I have time to do it properly
			takeUntil(this.destroyed$),
		);
	}
}
