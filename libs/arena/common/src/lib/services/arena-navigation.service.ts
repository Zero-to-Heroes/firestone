import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { ArenaCategoryType } from '../models/arena-category';
import { ArenaRun } from '../models/arena-run';

@Injectable()
export class ArenaNavigationService extends AbstractFacadeService<ArenaNavigationService> {
	public selectedPersonalRun$$: BehaviorSubject<ArenaRun | null>;
	public selectedCategoryId$$: BehaviorSubject<ArenaCategoryType | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaNavigationService', () => !!this.selectedPersonalRun$$);
	}

	protected override assignSubjects() {
		this.selectedPersonalRun$$ = this.mainInstance.selectedPersonalRun$$;
		this.selectedCategoryId$$ = this.mainInstance.selectedCategoryId$$;
	}

	protected async init() {
		this.selectedPersonalRun$$ = new BehaviorSubject<ArenaRun | null>(null);
		this.selectedCategoryId$$ = new BehaviorSubject<ArenaCategoryType | null>('arena-runs');
	}
}
