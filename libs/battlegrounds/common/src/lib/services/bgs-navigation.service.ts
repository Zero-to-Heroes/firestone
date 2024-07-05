import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class BattlegroundsNavigationService extends AbstractFacadeService<BattlegroundsNavigationService> {
	public selectedCategoryId$$: BehaviorSubject<CategoryId | string | null>;
	public heroSearchString$$: BehaviorSubject<string | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsNavigationService', () => !!this.selectedCategoryId$$);
	}

	protected override assignSubjects() {
		this.selectedCategoryId$$ = this.mainInstance.selectedCategoryId$$;
		this.heroSearchString$$ = this.mainInstance.heroSearchString$$;
	}

	protected async init() {
		this.selectedCategoryId$$ = new BehaviorSubject<CategoryId | string | null>('bgs-category-meta-heroes');
		this.heroSearchString$$ = new BehaviorSubject<string | null>(null);
	}
}

export type CategoryId =
	| 'bgs-category-personal-heroes'
	| 'bgs-category-meta-heroes'
	| 'bgs-category-meta-quests'
	| 'bgs-category-personal-quests'
	| 'bgs-category-personal-hero-details'
	| 'bgs-category-personal-rating'
	| 'bgs-category-personal-stats'
	| 'bgs-category-perfect-games'
	| 'bgs-category-leaderboard'
	| 'bgs-category-simulator';
