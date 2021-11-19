import { ChangeDetectorRef, HostListener, Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { Preferences } from '../models/preferences';
import { AppUiStoreFacadeService } from '../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../services/ui-store/app-ui-store.service';

@Injectable()
export abstract class AbstractSubscriptionComponent implements OnDestroy {
	protected destroyed$ = new Subject<void>();

	constructor(protected readonly store: AppUiStoreFacadeService, protected readonly cdr: ChangeDetectorRef) {}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}

	protected listenForBasicPref$<T>(selector: (prefs: Preferences) => T, ...logArgs: any[]) {
		return this.store
			.listenPrefs$((prefs) => selector(prefs))
			.pipe(
				map(([pref]) => pref),
				distinctUntilChanged(),
				tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
				tap((filter) => cdLog('emitting pref in ', this.constructor.name, filter, logArgs)),
				takeUntil(this.destroyed$),
			);
	}
	// export declare function map<T, R>(project: (value: T, index: number) => R, thisArg?: any): OperatorFunction<T, R>;

	// protected mapData<R>(
	// 	extractor: (...args) => R,
	// 	equality = null,
	// debounceTime = 100,
	// ): UnaryFunction<Observable<unknown>, Observable<R>> {
	// 	return pipe(
	// 		debounceTime(100),
	// 		map(extractor),
	// 		distinctUntilChanged(equality ?? ((a, b) => a === b)),
	// 		tap((filter) => setTimeout(() => this.cdr?.detectChanges(), 0)),
	// 		tap((filter) => cdLog('emitting activeTheme in ', this.constructor.name, filter)),
	// 		takeUntil(this.destroyed$),
	// 	);
	// }
}
