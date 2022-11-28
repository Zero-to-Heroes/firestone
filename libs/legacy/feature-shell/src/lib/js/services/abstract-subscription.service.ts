import { HostListener, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AppUiStoreFacadeService } from './ui-store/app-ui-store-facade.service';

@Injectable()
export abstract class AbstractSubscriptionService {
	protected destroyed$ = new Subject<void>();

	constructor(protected readonly store: AppUiStoreFacadeService) {}

	@HostListener('window:beforeunload')
	onDestroy() {
		this.destroyed$.next();
		this.destroyed$.complete();
	}
}
