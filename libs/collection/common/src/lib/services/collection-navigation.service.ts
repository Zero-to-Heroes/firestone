import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { CurrentView } from '../model/current-view.type';

@Injectable()
export class CollectionNavigationService extends AbstractFacadeService<CollectionNavigationService> {
	public currentView$$: BehaviorSubject<CurrentView | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CollectionNavigationService', () => !!this.currentView$$);
	}

	protected override assignSubjects() {
		this.currentView$$ = this.mainInstance.currentView$$;
	}

	protected async init() {
		this.currentView$$ = new BehaviorSubject<CurrentView | null>(null);
	}
}
