import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'bgs-tavern-minion',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-tavern-minion.component.scss',
	],
	template: `
		<div class="card" [ngClass]="{ 'highlighted': highlighted }">
			<!-- transparent image with 1:1 intrinsic aspect ratio -->
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
			<div class="highlight"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTavernMinionComponent {
	@Input() set minion(value: DeckCard) {
		this._minion = value;
		this.updateValues();
	}

	@Input() set highlightedTribes(value: readonly Race[]) {
		this._highlightedTribes = value;
		this.updateValues();
	}

	_minion: DeckCard;
	_highlightedTribes: readonly Race[];

	highlighted: boolean;

	constructor(private readonly allCards: AllCardsService) {}

	private updateValues() {
		if (!this._minion || !this._highlightedTribes?.length) {
			this.highlighted = false;
			return;
		}

		const card = this.allCards.getCard(this._minion.cardId);
		const tribe: Race = card.race ? Race[card.race.toUpperCase()] : Race.BLANK;
		this.highlighted = this._highlightedTribes.includes(tribe);
	}
}
