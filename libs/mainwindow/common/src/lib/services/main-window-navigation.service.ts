import { Injectable } from '@angular/core';
import { CurrentAppType } from '@firestone/shared/common/service';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MainWindowNavigationService extends AbstractFacadeService<MainWindowNavigationService> {
	public currentApp$$: BehaviorSubject<CurrentAppType | null>;
	public text$$: BehaviorSubject<string | null>;
	public image$$: BehaviorSubject<string | null>;
	public isVisible$$: BehaviorSubject<boolean | null>;
	public backArrowEnabled$$: BehaviorSubject<boolean | null>;
	public nextArrowEnabled$$: BehaviorSubject<boolean | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MainWindowNavigationService', () => !!this.currentApp$$);
	}

	protected override assignSubjects() {
		this.currentApp$$ = this.mainInstance.currentApp$$;
		this.text$$ = this.mainInstance.text$$;
		this.image$$ = this.mainInstance.image$$;
		this.isVisible$$ = this.mainInstance.isVisible$$;
		this.backArrowEnabled$$ = this.mainInstance.backArrowEnabled$$;
		this.nextArrowEnabled$$ = this.mainInstance.nextArrowEnabled$$;
	}

	protected async init() {
		this.currentApp$$ = new BehaviorSubject<CurrentAppType | null>('decktracker');
		this.text$$ = new BehaviorSubject<string | null>('Categories');
		this.image$$ = new BehaviorSubject<string | null>(null);
		this.isVisible$$ = new BehaviorSubject<boolean | null>(null);
		this.backArrowEnabled$$ = new BehaviorSubject<boolean | null>(null);
		this.nextArrowEnabled$$ = new BehaviorSubject<boolean | null>(null);
	}
}
