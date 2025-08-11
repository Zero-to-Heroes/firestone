import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { LotteryService, LotteryState } from '../..';

@Injectable({ providedIn: 'root' })
export class LotteryFacadeService extends AbstractFacadeService<LotteryFacadeService> {
	public lottery$$: SubscriberAwareBehaviorSubject<LotteryState | null>;

	private service: LotteryService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'LotteryFacadeService', () => !!this.lottery$$);
	}

	protected override assignSubjects() {
		this.lottery$$ = this.mainInstance.lottery$$;
	}

	protected override async init() {
		this.lottery$$ = new SubscriberAwareBehaviorSubject<LotteryState | null>(null);
		this.service = AppInjector.get(LotteryService);

		this.lottery$$.onFirstSubscribe(() => {
			this.service.lottery$$.subscribe(this.lottery$$);
		});
	}
}
