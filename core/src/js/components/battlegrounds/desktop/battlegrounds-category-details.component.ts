import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BattlegroundsAppState } from '../../../models/mainwindow/battlegrounds/battlegrounds-app-state';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';
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
				[hidden]="navigation.navigationBattlegrounds.selectedCategoryId !== 'bgs-category-personal-heroes'"
				[category]="category"
				[state]="state"
			>
			</battlegrounds-personal-stats-heroes>
			<battlegrounds-personal-stats-rating
				[hidden]="navigation.navigationBattlegrounds.selectedCategoryId !== 'bgs-category-personal-rating'"
				[category]="category"
				[state]="state"
			>
			</battlegrounds-personal-stats-rating>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCategoryDetailsComponent {
	@Input() category: BattlegroundsCategory;
	@Input() state: BattlegroundsAppState;
	@Input() navigation: NavigationState;
}
