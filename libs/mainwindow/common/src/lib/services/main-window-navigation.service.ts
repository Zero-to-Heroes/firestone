import { Injectable } from '@angular/core';
import { CurrentAppType, Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { NavigationState } from '../model/_barrel';

@Injectable()
export class MainWindowNavigationService extends AbstractFacadeService<MainWindowNavigationService> {
	public navigationState$$: BehaviorSubject<NavigationState | null>;
	public currentApp$$: BehaviorSubject<CurrentAppType | null>;
	public text$$: BehaviorSubject<string | null>;
	public image$$: BehaviorSubject<string | null>;
	public isVisible$$: BehaviorSubject<boolean | null>;
	public backArrowEnabled$$: BehaviorSubject<boolean | null>;
	public nextArrowEnabled$$: BehaviorSubject<boolean | null>;

	private prefs: PreferencesService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MainWindowNavigationService', () => !!this.currentApp$$);
	}

	protected override assignSubjects() {
		this.navigationState$$ = this.mainInstance.navigationState$$;
		this.currentApp$$ = this.mainInstance.currentApp$$;
		this.text$$ = this.mainInstance.text$$;
		this.image$$ = this.mainInstance.image$$;
		this.isVisible$$ = this.mainInstance.isVisible$$;
		this.backArrowEnabled$$ = this.mainInstance.backArrowEnabled$$;
		this.nextArrowEnabled$$ = this.mainInstance.nextArrowEnabled$$;
	}

	protected async init() {
		this.navigationState$$ = new BehaviorSubject<NavigationState | null>(null);
		this.currentApp$$ = new BehaviorSubject<CurrentAppType | null>('replays');
		this.text$$ = new BehaviorSubject<string | null>('Categories');
		this.image$$ = new BehaviorSubject<string | null>(null);
		this.isVisible$$ = new BehaviorSubject<boolean | null>(null);
		this.backArrowEnabled$$ = new BehaviorSubject<boolean | null>(null);
		this.nextArrowEnabled$$ = new BehaviorSubject<boolean | null>(null);

		this.prefs = AppInjector.get(PreferencesService);

		const prefs = await this.prefs.getPreferences();
		const currentApp = prefs.currentMainVisibleSection;
		if (currentApp) {
			this.currentApp$$.next(currentApp);
		}

		this.currentApp$$.subscribe(async (app) => {
			const prefs = await this.prefs.getPreferences();
			const newPrefs: Preferences = {
				...prefs,
				currentMainVisibleSection: app ?? 'replays',
			};
			await this.prefs.savePreferences(newPrefs);
		});
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.navigationState$$, 'MainWindowNavigationService-navigationState');
		this.setupElectronSubject(this.currentApp$$, 'MainWindowNavigationService-currentApp');
		this.setupElectronSubject(this.text$$, 'MainWindowNavigationService-text');
		this.setupElectronSubject(this.image$$, 'MainWindowNavigationService-image');
		this.setupElectronSubject(this.isVisible$$, 'MainWindowNavigationService-isVisible');
		this.setupElectronSubject(this.backArrowEnabled$$, 'MainWindowNavigationService-backArrowEnabled');
		this.setupElectronSubject(this.nextArrowEnabled$$, 'MainWindowNavigationService-nextArrowEnabled');
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.navigationState$$ = new BehaviorSubject<NavigationState | null>(null);
		this.currentApp$$ = new BehaviorSubject<CurrentAppType | null>('replays');
		this.text$$ = new BehaviorSubject<string | null>('Categories');
		this.image$$ = new BehaviorSubject<string | null>(null);
		this.isVisible$$ = new BehaviorSubject<boolean | null>(null);
		this.backArrowEnabled$$ = new BehaviorSubject<boolean | null>(null);
		this.nextArrowEnabled$$ = new BehaviorSubject<boolean | null>(null);
	}
}
