import { Injectable } from '@angular/core';
import { AbstractFacadeService, IAdsService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class StandaloneAdService extends AbstractFacadeService<StandaloneAdService> implements IAdsService {
	public hasPremiumSub$$: BehaviorSubject<boolean>;
	public enablePremiumFeatures$$: BehaviorSubject<boolean>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'StandaloneAdService', () => true);
	}

	protected override assignSubjects() {
		this.enablePremiumFeatures$$ = this.mainInstance.enablePremiumFeatures$$;
		this.hasPremiumSub$$ = this.mainInstance.hasPremiumSub$$;
	}

	protected async init() {
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(true);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(true);
	}

	protected override initElectronSubjects() {
		console.debug('[electron-ad] initElectronSubjects');
		this.setupElectronSubject(this.enablePremiumFeatures$$, 'enablePremiumFeatures');
		this.setupElectronSubject(this.hasPremiumSub$$, 'hasPremiumSub');
	}

	protected override createElectronProxy(ipcRenderer: any) {
		console.debug('[electron-ad] createElectronProxy');
		this.enablePremiumFeatures$$ = new BehaviorSubject<boolean>(true);
		this.hasPremiumSub$$ = new BehaviorSubject<boolean>(true);
	}

	public async goToPremium() {
		return;
	}

	public async shouldDisplayAds(): Promise<boolean> {
		return false;
	}
}
