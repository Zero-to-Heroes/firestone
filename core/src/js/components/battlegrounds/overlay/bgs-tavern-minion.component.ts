import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { FeatureFlags } from '../../../services/feature-flags';

@Component({
	selector: 'bgs-tavern-minion',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/battlegrounds/overlay/bgs-tavern-minion.component.scss',
	],
	template: `
		<div class="card" [ngClass]="{ 'highlighted': showMinionHighlight && highlighted }">
			<!-- transparent image with 1:1 intrinsic aspect ratio -->
			<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" />
			<div class="highlight"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTavernMinionComponent {
	showMinionHighlight = FeatureFlags.ENABLE_BG_TRIBE_HIGHLIGHT;

	@Input() set minion(value: DeckCard) {
		this._minion = value;
		this.updateValues();
	}

	@Input() set highlightedTribes(value: readonly Race[]) {
		this._highlightedTribes = value ?? [];
		this.updateValues();
	}

	@Input() set highlightedMinions(value: readonly string[]) {
		this._highlightedMinions = value ?? [];
		this.updateValues();
	}

	_minion: DeckCard;
	_highlightedTribes: readonly Race[] = [];
	_highlightedMinions: readonly string[] = [];

	highlighted: boolean;

	constructor(private readonly allCards: AllCardsService) {}

	private updateValues() {
		if (
			!this.showMinionHighlight ||
			!this._minion ||
			(!this._highlightedTribes?.length && !this._highlightedMinions?.length)
		) {
			this.highlighted = false;
			return;
		}

		const card = this.allCards.getCard(this._minion.cardId);
		const tribe: Race = card.race ? Race[card.race.toUpperCase()] : Race.BLANK;
		this.highlighted =
			this._highlightedTribes.includes(tribe) ||
			(this._highlightedTribes.length > 0 && tribe === Race.ALL) ||
			this._highlightedMinions.includes(card.id);
	}
}
