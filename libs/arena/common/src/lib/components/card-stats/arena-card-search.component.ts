import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ArenaCardStatsService } from '../../services/arena-card-stats.service';

@Component({
	standalone: false,
	selector: 'arena-card-search',
	styleUrls: [`./arena-card-search.component.scss`],
	template: `
		<fs-text-input
			(fsModelUpdate)="onTextChanged($event)"
			[placeholder]="'app.collection.card-search.search-box-placeholder' | fsTranslate"
			[tooltip]="'app.arena.card-search-tooltip' | fsTranslate"
		>
		</fs-text-input>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaCardSearchComponent {
	constructor(private readonly cardsService: ArenaCardStatsService) {}

	onTextChanged(newText: string) {
		this.cardsService.newSearchString(newText);
	}
}
