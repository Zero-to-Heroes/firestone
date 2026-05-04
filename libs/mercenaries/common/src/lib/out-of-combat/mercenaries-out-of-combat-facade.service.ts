import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { MercenariesOutOfCombatState } from '../services/out-of-combat/mercenaries-out-of-combat-state';
import { MercenariesOutOfCombatService } from './mercenaries-out-of-combat.service';

@Injectable({ providedIn: 'root' })
export class MercenariesOutOfCombatFacadeService extends AbstractFacadeService<MercenariesOutOfCombatFacadeService> {
	public store$$: SubscriberAwareBehaviorSubject<MercenariesOutOfCombatState | null>;

	private service: MercenariesOutOfCombatService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MercenariesOutOfCombatFacadeService', () => !!this.store$$);
	}

	protected override assignSubjects() {
		this.store$$ = this.mainInstance.store$$;
	}

	protected async init() {
		this.store$$ = new SubscriberAwareBehaviorSubject<MercenariesOutOfCombatState | null>(null);
		this.service = AppInjector.get(MercenariesOutOfCombatService);

		this.store$$.onFirstSubscribe(() => {
			this.service.store$.subscribe(this.store$$);
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.store$$, 'MercenariesOutOfCombatFacadeService-store');
	}

	protected override createElectronProxy(ipcRenderer: any): void | Promise<void> {
		this.store$$ = new SubscriberAwareBehaviorSubject<MercenariesOutOfCombatState | null>(null);
	}
}
