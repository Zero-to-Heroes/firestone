import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';
import { NavigationState } from '../../../models/mainwindow/navigation/navigation-state';

@Component({
	selector: 'battlegrounds-category-details',
	styleUrls: [
		`../../../../css/component/app-section.component.scss`,
		`../../../../css/component/battlegrounds/desktop/battlegrounds-category-details.component.scss`,
	],
	template: `
		<div class="battlegrounds-category-details">
			<battlegrounds-personal-stats-heroes
				[hidden]="navigation.navigationBattlegrounds.selectedCategoryId !== 'bgs-category-personal-heroes'"
				[category]="category"
			>
			</battlegrounds-personal-stats-heroes>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCategoryDetailsComponent {
	@Input() category: BattlegroundsCategory;
	@Input() navigation: NavigationState;
}
