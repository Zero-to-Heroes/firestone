import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { ArenaCategoryType } from '../models/arena-category';

@Injectable()
export class ArenaNavigationService extends AbstractFacadeService<ArenaNavigationService> {
	public menuDisplayType$$: BehaviorSubject<'menu' | 'breadcrumbs'>;
	public selectedPersonalRunId$$: BehaviorSubject<string | null>;
	public selectedCategoryId$$: BehaviorSubject<ArenaCategoryType | null>;
	public expandedRunIds$$: BehaviorSubject<readonly string[] | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaNavigationService', () => !!this.selectedPersonalRunId$$);
	}

	protected override assignSubjects() {
		this.menuDisplayType$$ = this.mainInstance.menuDisplayType$$;
		this.selectedPersonalRunId$$ = this.mainInstance.selectedPersonalRunId$$;
		this.selectedCategoryId$$ = this.mainInstance.selectedCategoryId$$;
		this.expandedRunIds$$ = this.mainInstance.expandedRunIds$$;
	}

	protected async init() {
		this.menuDisplayType$$ = new BehaviorSubject<'menu' | 'breadcrumbs'>('menu');
		this.selectedPersonalRunId$$ = new BehaviorSubject<string | null>(null);
		this.selectedCategoryId$$ = new BehaviorSubject<ArenaCategoryType | null>('arena-runs');
		this.expandedRunIds$$ = new BehaviorSubject<readonly string[] | null>(null);
	}
}
