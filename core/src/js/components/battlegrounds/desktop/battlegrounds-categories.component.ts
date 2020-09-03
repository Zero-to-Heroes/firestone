import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BattlegroundsCategory } from '../../../models/mainwindow/battlegrounds/battlegrounds-category';

@Component({
	selector: 'battlegrounds-categories',
	styleUrls: [
		`../../../../css/component/battlegrounds/desktop/battlegrounds-categories.component.scss`,
		`../../../../css/global/scrollbar.scss`,
	],
	template: `
		<div class="battlegrounds-categories">
			<ul class="battlegrounds-categories-list" scrollable>
				<li *ngFor="let category of categories">
					<battlegrounds-category [category]="category"> </battlegrounds-category>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsCategoriesComponent {
	@Input() categories: readonly BattlegroundsCategory[];
}
