import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { CurrentView } from '../model/current-view.type';

@Injectable()
export class CollectionNavigationService extends AbstractFacadeService<CollectionNavigationService> {
	public currentView$$: BehaviorSubject<CurrentView | null>;
	public menuDisplayType$$: BehaviorSubject<'menu' | 'breadcrumbs'>;
	public searchString$$: BehaviorSubject<string | null>;
	public selectedSetId$$: BehaviorSubject<string | null>;
	public selectedCardId$$: BehaviorSubject<string | null>;
	public selectedCardBackId$$: BehaviorSubject<number | null>;

	private viewHistory: CurrentView[] = [];

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
		this.menuDisplayType$$ = new BehaviorSubject<'menu' | 'breadcrumbs'>('menu');
		this.searchString$$ = new BehaviorSubject<string | null>(null);
		this.selectedSetId$$ = new BehaviorSubject<string | null>(null);
		this.selectedCardId$$ = new BehaviorSubject<string | null>(null);
		this.selectedCardBackId$$ = new BehaviorSubject<number | null>(null);

		this.currentView$$.subscribe((view) => {
			if (!view) {
				return;
			}
			this.viewHistory.push(view);
			if (this.viewHistory.length > 2) {
				this.viewHistory.shift(); // keep only the last two values
			}
		});
	}

	public goUp(): void {
		switch (this.currentView$$.getValue()) {
			case 'sets':
				// this.currentView$$.next();
				this.menuDisplayType$$.next('menu');
				this.searchString$$.next(null);
				this.selectedSetId$$.next(null);
				this.selectedCardId$$.next(null);
				this.selectedCardBackId$$.next(null);
				break;
			case 'cards':
				this.currentView$$.next('sets');
				this.menuDisplayType$$.next('menu');
				this.searchString$$.next(null);
				this.selectedSetId$$.next(null);
				this.selectedCardId$$.next(null);
				this.selectedCardBackId$$.next(null);
				break;
			case 'card-details':
				console.debug('[collection-navigation] going back up from card-details', this.viewHistory);
				this.currentView$$.next(this.viewHistory[0] ?? 'cards');
				this.searchString$$.next(null);
				// this.selectedSetId$$.next(null);
				this.selectedCardId$$.next(null);
				this.selectedCardBackId$$.next(null);
				break;
		}
	}
}
