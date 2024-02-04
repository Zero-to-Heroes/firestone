import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { ArenaCategoryType } from '../models/arena-category';

@Injectable()
export class ArenaNavigationService extends AbstractFacadeService<ArenaNavigationService> {
	public selectedPersonalDeckstring$$: BehaviorSubject<string | null>;
	public selectedCategoryId$$: BehaviorSubject<ArenaCategoryType | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'ArenaNavigationService', () => !!this.selectedPersonalDeckstring$$);
	}

	protected override assignSubjects() {
		this.selectedPersonalDeckstring$$ = this.mainInstance.selectedPersonalDeckstring$$;
		this.selectedCategoryId$$ = this.mainInstance.selectedCategoryId$$;
	}

	protected async init() {
		this.selectedPersonalDeckstring$$ = new BehaviorSubject<string | null>(null);
		this.selectedCategoryId$$ = new BehaviorSubject<ArenaCategoryType | null>('arena-runs');
	}
}
