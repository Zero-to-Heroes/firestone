import { HostListener, Injectable, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable()
export abstract class AbstractSubscriptionComponent implements OnDestroy {
	protected destroyed$ = new Subject<void>();

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}
}
