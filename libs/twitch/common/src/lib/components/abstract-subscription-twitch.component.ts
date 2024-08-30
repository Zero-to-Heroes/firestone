import { ChangeDetectorRef, HostListener, Injectable, OnDestroy, ViewRef } from '@angular/core';
import { arraysEqual } from '@firestone/shared/framework/common';
import { Observable, pipe, Subject, UnaryFunction } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';

@Injectable()
export abstract class AbstractSubscriptionTwitchComponent implements OnDestroy {
	protected destroyed$ = new Subject<void>();

	constructor(protected readonly cdr: ChangeDetectorRef) {}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}

	protected mapData<T, R>(
		extractor: (arg: T) => R,
		equality = null,
		debounceTimeMs = 100,
	): UnaryFunction<Observable<T>, Observable<R>> {
		return pipe(
			debounceTime(debounceTimeMs),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			map(extractor),
			distinctUntilChanged(equality ?? ((a, b) => arraysEqual(a, b))),
			tap((filter) =>
				setTimeout(() => {
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr?.detectChanges();
					}
				}, 0),
			),
			takeUntil(this.destroyed$),
		);
	}
}
