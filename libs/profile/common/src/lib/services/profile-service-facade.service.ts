import { Injectable } from '@angular/core';
import { ProfileBgHeroStat, ProfileClassProgress } from '@firestone-hs/api-user-profile';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { InternalProfileBattlegroundsService } from './internal/internal-profile-battlegrounds.service';
import { InternalProfileInfoService } from './internal/internal-profile-info.service';

@Injectable()
export class ProfileServiceFacade extends AbstractFacadeService<ProfileServiceFacade> {
	public classesProgress$$: BehaviorSubject<readonly ProfileClassProgress[]>;
	public bgFullTimeStatsByHero$$: SubscriberAwareBehaviorSubject<readonly ProfileBgHeroStat[]>;

	private internalProfileInfo: InternalProfileInfoService;
	private internalProfileBattlegrounds: InternalProfileBattlegroundsService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ProfileServiceFacade', () => !!this.classesProgress$$ && !!this.bgFullTimeStatsByHero$$);
	}

	protected override assignSubjects(): void {
		this.classesProgress$$ = this.mainInstance.classesProgress$$;
		this.bgFullTimeStatsByHero$$ = this.mainInstance.bgFullTimeStatsByHero$$;
	}

	protected async init(): Promise<void> {
		this.classesProgress$$ = new BehaviorSubject<readonly ProfileClassProgress[]>([]);
		this.bgFullTimeStatsByHero$$ = new SubscriberAwareBehaviorSubject<readonly ProfileBgHeroStat[]>([]);
		this.internalProfileInfo = AppInjector.get(InternalProfileInfoService);
		this.internalProfileBattlegrounds = AppInjector.get(InternalProfileBattlegroundsService);

		this.internalProfileInfo.classesProgress$$.subscribe((classesProgress) => {
			this.classesProgress$$.next(classesProgress);
		});
		this.internalProfileBattlegrounds.bgFullTimeStatsByHero$$.subscribe((bgFullTimeStatsByHero) => {
			this.bgFullTimeStatsByHero$$.next(bgFullTimeStatsByHero);
		});
	}

	protected override createElectronProxy(_ipcRenderer: unknown): void {
		this.classesProgress$$ = new BehaviorSubject<readonly ProfileClassProgress[]>([]);
		this.bgFullTimeStatsByHero$$ = new SubscriberAwareBehaviorSubject<readonly ProfileBgHeroStat[]>([]);
	}

	protected override initElectronSubjects(): void {
		this.setupElectronSubject(this.classesProgress$$, 'ProfileServiceFacade-classesProgress');
		this.setupElectronSubject(this.bgFullTimeStatsByHero$$, 'ProfileServiceFacade-bgHeroStats');
	}
}
