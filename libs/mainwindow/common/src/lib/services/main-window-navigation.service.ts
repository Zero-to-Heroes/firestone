import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MainWindowNavigationService extends AbstractFacadeService<MainWindowNavigationService> {
	public text$$: BehaviorSubject<string | null>;
	public image$$: BehaviorSubject<string | null>;
	public backArrowEnabled$$: BehaviorSubject<boolean | null>;
	public nextArrowEnabled$$: BehaviorSubject<boolean | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MainWindowNavigationService', () => !!this.text$$);
	}

	protected override assignSubjects() {
		this.text$$ = this.mainInstance.text$$;
		this.image$$ = this.mainInstance.image$$;
		this.backArrowEnabled$$ = this.mainInstance.backArrowEnabled$$;
		this.nextArrowEnabled$$ = this.mainInstance.nextArrowEnabled$$;
	}

	protected async init() {
		this.text$$ = new BehaviorSubject<string | null>('Categories');
		this.image$$ = new BehaviorSubject<string | null>(null);
		this.backArrowEnabled$$ = new BehaviorSubject<boolean | null>(null);
		this.nextArrowEnabled$$ = new BehaviorSubject<boolean | null>(null);
	}
}
