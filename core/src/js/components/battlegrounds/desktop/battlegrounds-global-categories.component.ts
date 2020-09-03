import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BattlegroundsGlobalCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-global-category';

@Component({
	selector: 'battlegrounds-global-categories',
	styleUrls: [
		`../../../../css/component/battlegrounds/desktop/battlegrounds-global-categories.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="battlegrounds-global-categories">
			<ul class="battlegrounds-global-categories-list" scrollable>
				<li *ngFor="let category of globalCategories">
					<battlegrounds-global-category [category]="category"> </battlegrounds-global-category>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsGlobalCategoriesComponent {
	@Input() globalCategories: readonly BattlegroundsGlobalCategory[];
}
