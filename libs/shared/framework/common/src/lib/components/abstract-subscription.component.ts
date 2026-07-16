import { ChangeDetectorRef, HostListener, Injectable, OnDestroy, Optional, ViewRef } from '@angular/core';
import { Observable, Subject, UnaryFunction, pipe } from 'rxjs';
import { auditTime, distinctUntilChanged, map, takeUntil, tap } from 'rxjs/operators';
import { shallowEqual } from '../libs/utils';

@Injectable()
export abstract class AbstractSubscriptionComponent implements OnDestroy {
	protected destroyed$ = new Subject<void>();

	constructor(@Optional() protected readonly cdr?: ChangeDetectorRef) {}

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
			auditTime(debounceTimeMs),
			map(extractor),
			// shallowEqual (and not just arraysEqual) so that extractors building fresh object
			// literals from a bigger state object don't defeat deduplication: without it, every
			// upstream emission (e.g. any unrelated preference update) would trigger a recompute
			// and a markForCheck in every subscribed component
			distinctUntilChanged(!!equality ? (a, b) => equality(a, b) : (a, b) => shallowEqual(a, b)),
			tap(() => {
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr!.markForCheck();
				}
			}),
			takeUntil(this.destroyed$),
		);
	}
}
