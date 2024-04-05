import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { CurrentView } from '../model/current-view.type';

@Injectable()
export class CollectionNavigationService extends AbstractFacadeService<CollectionNavigationService> {
	public currentView$$: BehaviorSubject<CurrentView | null>;
	public menuDisplayType$$: BehaviorSubject<string>;
	public searchString$$: BehaviorSubject<string | null>;
	public selectedSetId$$: BehaviorSubject<string | null>;
	public selectedCardId$$: BehaviorSubject<string | null>;
	public selectedCardBackId$$: BehaviorSubject<number | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'CollectionNavigationService', () => !!this.currentView$$);
	}

	protected override assignSubjects() {
		this.currentView$$ = this.mainInstance.currentView$$;
		this.menuDisplayType$$ = this.mainInstance.menuDisplayType$$;
		this.searchString$$ = this.mainInstance.searchString$$;
		this.selectedSetId$$ = this.mainInstance.selectedSetId$$;
		this.selectedCardId$$ = this.mainInstance.selectedCardId$$;
		this.selectedCardBackId$$ = this.mainInstance.selectedCardBackId$$;
	}

	protected async init() {
		this.currentView$$ = new BehaviorSubject<CurrentView | null>(null);
		this.menuDisplayType$$ = new BehaviorSubject<string>('menu');
		this.searchString$$ = new BehaviorSubject<string | null>(null);
		this.selectedSetId$$ = new BehaviorSubject<string | null>(null);
		this.selectedCardId$$ = new BehaviorSubject<string | null>(null);
		this.selectedCardBackId$$ = new BehaviorSubject<number | null>(null);
	}
}
