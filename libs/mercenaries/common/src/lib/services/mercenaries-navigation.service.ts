import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class MercenariesNavigationService extends AbstractFacadeService<MercenariesNavigationService> {
	public heroSearchString$$: BehaviorSubject<string | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'MercenariesNavigationService', () => !!this.heroSearchString$$);
	}

	protected override assignSubjects() {
		this.heroSearchString$$ = this.mainInstance.heroSearchString$$;
	}

	protected async init() {
		this.heroSearchString$$ = new BehaviorSubject<string | null>(null);
	}
}
