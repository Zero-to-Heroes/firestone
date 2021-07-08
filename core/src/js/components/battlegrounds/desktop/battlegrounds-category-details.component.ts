import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { MainWindowState } from '../../../models/mainwindow/main-window-state';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';

@Component({
	selector: 'battlegrounds-category-details',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-category-details.component.scss`,
	],
	template: `
		<div class="battlegrounds-category-details" scrollable>
			<battlegrounds-personal-stats-heroes
				*ngxCacheIf="navigation.navigationBattlegrounds.selectedCategoryId === 'bgs-category-personal-heroes'"
			>
			</battlegrounds-personal-stats-heroes>
			<battlegrounds-personal-stats-rating
				*ngxCacheIf="navigation.navigationBattlegrounds.selectedCategoryId === 'bgs-category-personal-rating'"
			>
			</battlegrounds-personal-stats-rating>
			<battlegrounds-personal-stats-stats
				*ngxCacheIf="navigation.navigationBattlegrounds.selectedCategoryId === 'bgs-category-personal-stats'"
			>
			</battlegrounds-personal-stats-stats>
			<battlegrounds-perfect-games
				*ngxCacheIf="navigation.navigationBattlegrounds.selectedCategoryId === 'bgs-category-perfect-games'"
			>
			</battlegrounds-perfect-games>
			<battlegrounds-personal-stats-hero-details
				*ngxCacheIf="
					navigation.navigationBattlegrounds.selectedCategoryId &&
					navigation.navigationBattlegrounds.selectedCategoryId.indexOf(
						'bgs-category-personal-hero-details'
					) !== -1
				"
			>
			</battlegrounds-personal-stats-hero-details>
			<battlegrounds-simulator
				*ngxCacheIf="navigation.navigationBattlegrounds.selectedCategoryId === 'bgs-category-simulator'"
			>
			</battlegrounds-simulator>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCategoryDetailsComponent {
	@Input() category: BattlegroundsCategory;
	@Input() state: MainWindowState;
	@Input() navigation: NavigationState;
}
