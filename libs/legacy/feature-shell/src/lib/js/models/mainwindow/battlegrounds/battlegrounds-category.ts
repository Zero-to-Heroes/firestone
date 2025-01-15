import { CategoryId } from '@firestone/battlegrounds/common';

export interface BattlegroundsCategory {
	readonly id: CategoryId;
	readonly name: string;
	// readonly icon: string;
	// readonly disabledTooltip?: string;
}
// export type BattlegroundsCategoryId =
// 	| 'bgs-category-overview'
// 	| 'bgs-category-personal-heroes'
// 	| 'bgs-category-meta-heroes'
// 	| 'bgs-category-meta-quests'
// 	| 'bgs-category-meta-trinkets'
// 	| 'bgs-category-personal-quests'
// 	| 'bgs-category-personal-hero-details-' // Also add the hero card Id as suffix
// 	| 'bgs-category-personal-rating'
// 	| 'bgs-category-personal-stats'
// 	| 'bgs-category-perfect-games'
// 	| 'bgs-category-simulator'
// 	| 'bgs-category-personal-ai';
