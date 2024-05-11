import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { ArenaCategoryType } from '../models/arena-category';
import { ArenaRun } from '../models/arena-run';

@Injectable()
export class ArenaNavigationService extends AbstractFacadeService<ArenaNavigationService> {
	public menuDisplayType$$: BehaviorSubject<'menu' | 'breadcrumbs'>;
	public selectedPersonalRun$$: BehaviorSubject<ArenaRun | null>;
	public selectedCategoryId$$: BehaviorSubject<ArenaCategoryType | null>;
	public expandedRunIds$$: BehaviorSubject<readonly string[] | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaNavigationService', () => !!this.selectedPersonalRun$$);
	}

	protected override assignSubjects() {
		this.menuDisplayType$$ = this.mainInstance.menuDisplayType$$;
		this.selectedPersonalRun$$ = this.mainInstance.selectedPersonalRun$$;
		this.selectedCategoryId$$ = this.mainInstance.selectedCategoryId$$;
		this.expandedRunIds$$ = this.mainInstance.expandedRunIds$$;
	}

	protected async init() {
		this.menuDisplayType$$ = new BehaviorSubject<'menu' | 'breadcrumbs'>('menu');
		this.selectedPersonalRun$$ = new BehaviorSubject<ArenaRun | null>(null);
		this.selectedCategoryId$$ = new BehaviorSubject<ArenaCategoryType | null>('arena-runs');
		this.expandedRunIds$$ = new BehaviorSubject<readonly string[] | null>(null);
	}
}
