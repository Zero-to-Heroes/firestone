import { Injectable } from '@angular/core';
import { GameEvent } from '@firestone/game-state';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { MercenariesBattleStateService } from './mercenaries-battle-state.service';
import { MercenariesBattleState } from './services/mercenaries-battle-state';

@Injectable({ providedIn: 'root' })
export class MercenariesBattleStateFacadeService extends AbstractFacadeService<MercenariesBattleStateFacadeService> {
	public store$$: SubscriberAwareBehaviorSubject<MercenariesBattleState | null>;

	private service: MercenariesBattleStateService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MercenariesStoreFacadeService', () => !!this.store$$);
	}

	protected override assignSubjects() {
		this.store$$ = this.mainInstance.store$$;
	}

	protected async init() {
		this.store$$ = new SubscriberAwareBehaviorSubject<MercenariesBattleState | null>(null);
		this.service = AppInjector.get(MercenariesBattleStateService);

		this.store$$.onFirstSubscribe(() => {
			this.service.battleState$$.subscribe(this.store$$);
		});
	}

	protected override async initElectronMainProcess() {
		this.registerMainProcessMethod('addBattleEventInternal', (gameEvent: GameEvent | null) =>
			this.addBattleEventInternal(gameEvent),
		);
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.store$$, 'MercenariesStoreFacadeService-store');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.store$$ = new SubscriberAwareBehaviorSubject<MercenariesBattleState | null>(null);
	}

	public addBattleEvent(event: GameEvent | null): void {
		if (!event) {
			return;
		}

		this.callOnMainProcess('addBattleEventInternal', event);
	}
	private addBattleEventInternal(event: GameEvent | null): void {
		this.service.internalEventSubject$.next(event);
	}
}
