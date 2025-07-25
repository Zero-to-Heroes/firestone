import { Injectable } from '@angular/core';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class BattlegroundsNavigationService extends AbstractFacadeService<BattlegroundsNavigationService> {
	public selectedCategoryId$$: BehaviorSubject<CategoryId | string | null>;
	public heroSearchString$$: BehaviorSubject<string | null>;
	public currentView$$: BehaviorSubject<CurrentView | null>;
	public menuDisplayType$$: BehaviorSubject<string | null>;
	public selectedPersonalHeroStatsTab$$: BehaviorSubject<BgsHeroStatsFilterId | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'BattlegroundsNavigationService', () => !!this.selectedCategoryId$$);
	}

	protected override assignSubjects() {
		this.selectedCategoryId$$ = this.mainInstance.selectedCategoryId$$;
		this.heroSearchString$$ = this.mainInstance.heroSearchString$$;
		this.currentView$$ = this.mainInstance.currentView$$;
		this.menuDisplayType$$ = this.mainInstance.menuDisplayType$$;
		this.selectedPersonalHeroStatsTab$$ = this.mainInstance.selectedPersonalHeroStatsTab$$;
	}

	protected async init() {
		this.selectedCategoryId$$ = new BehaviorSubject<CategoryId | string | null>('bgs-category-meta-heroes');
		this.heroSearchString$$ = new BehaviorSubject<string | null>(null);
		this.currentView$$ = new BehaviorSubject<CurrentView | null>('list');
		this.menuDisplayType$$ = new BehaviorSubject<string | null>('menu');
		this.selectedPersonalHeroStatsTab$$ = new BehaviorSubject<BgsHeroStatsFilterId | null>('winrate-stats');
	}
}

export type CategoryId =
	| 'bgs-category-your-stats'
	| 'bgs-category-personal-heroes'
	| 'bgs-category-meta-heroes'
	| 'bgs-category-meta-quests'
	| 'bgs-category-meta-trinkets'
	| 'bgs-category-meta-cards'
	| 'bgs-category-personal-quests'
	| 'bgs-category-personal-hero-details'
	| 'bgs-category-personal-rating'
	| 'bgs-category-personal-stats'
	| 'bgs-category-perfect-games'
	| 'bgs-category-leaderboard'
	| 'bgs-category-simulator';
export type CurrentView = 'categories' | 'category' | 'list' | undefined;
export type BgsHeroStatsFilterId = 'strategies' | 'final-warbands' | 'warband-stats' | 'mmr' | 'winrate-stats';
