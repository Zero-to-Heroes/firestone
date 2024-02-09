import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class DuelsNavigationService extends AbstractFacadeService<DuelsNavigationService> {
	public selectedPersonalDeckstring$$: BehaviorSubject<string | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'duelsConfig', () => !!this.selectedPersonalDeckstring$$);
	}

	protected override assignSubjects() {
		this.selectedPersonalDeckstring$$ = this.mainInstance.selectedPersonalDeckstring$$;
	}

	protected async init() {
		this.selectedPersonalDeckstring$$ = new BehaviorSubject<string | null>(null);
	}
}
