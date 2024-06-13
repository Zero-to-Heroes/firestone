import { ChangeDetectorRef, HostListener, Injectable, OnDestroy, ViewRef } from '@angular/core';
import { Observable, Subject, UnaryFunction, pipe } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { arraysEqual } from '../libs/utils';

@Injectable()
export abstract class AbstractSubscriptionComponent implements OnDestroy {
	protected destroyed$ = new Subject<void>();

	constructor(protected readonly cdr: ChangeDetectorRef) {}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}

	protected mapData<T, R>(
		extractor: (arg: T) => R,
		equality: ((a: R, b: R) => boolean) | null = null,
		debounceTimeMs = 100,
	): UnaryFunction<Observable<T>, Observable<R>> {
		return pipe(
			debounceTime(debounceTimeMs),
			map(extractor),
			distinctUntilChanged(!!equality ? (a, b) => equality(a, b) : (a, b) => arraysEqual(a, b)),
			tap((filter) =>
				setTimeout(() => {
					if (!(this.cdr as ViewRef)?.destroyed) {
						this.cdr.detectChanges();
					}
				}, 0),
			),
			takeUntil(this.destroyed$),
		);
	}
}
