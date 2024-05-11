/* eslint-disable no-case-declarations */
import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { CurrentView } from '../models/current-view.type';

@Injectable()
export class AchievementsNavigationService extends AbstractFacadeService<AchievementsNavigationService> {
	public currentView$$: BehaviorSubject<CurrentView | null>;
	public menuDisplayType$$: BehaviorSubject<'menu' | 'breadcrumbs'>;
	public selectedCategoryId$$: BehaviorSubject<string | null>;

	private viewHistory: CurrentView[] = [];

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'AchievementsNavigationService', () => !!this.currentView$$);
	}

	protected override assignSubjects() {
		this.currentView$$ = this.mainInstance.currentView$$;
		this.menuDisplayType$$ = this.mainInstance.menuDisplayType$$;
		this.selectedCategoryId$$ = this.mainInstance.selectedCategoryId$$;
	}

	protected async init() {
		this.currentView$$ = new BehaviorSubject<CurrentView | null>('categories');
		this.menuDisplayType$$ = new BehaviorSubject<'menu' | 'breadcrumbs'>('menu');
		this.selectedCategoryId$$ = new BehaviorSubject<string | null>(null);

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
		console.debug('[navigation] goUp', this.currentView$$.getValue());
		switch (this.currentView$$.getValue()) {
			case 'categories':
			case 'list':
				const categoryHierarchy = this.selectedCategoryId$$.getValue()?.split('/');
				const newCategoryHierarchy =
					categoryHierarchy?.slice(0, categoryHierarchy.length - 1)?.join('/') ?? null;
				this.currentView$$.next('categories');
				this.menuDisplayType$$.next(!!newCategoryHierarchy?.length ? 'breadcrumbs' : 'menu');
				this.selectedCategoryId$$.next(newCategoryHierarchy);
				return;
			default:
				return;
		}
	}
}
