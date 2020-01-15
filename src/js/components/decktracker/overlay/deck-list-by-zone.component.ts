import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckCard } from '../../../models/decktracker/deck-card';
import { DeckState } from '../../../models/decktracker/deck-state';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { DynamicZone } from '../../../models/decktracker/view/dynamic-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';

@Component({
	selector: 'deck-list-by-zone',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/deck-list-by-zone.component.scss',
	],
	template: `
		<ul class="deck-list">
			<li *ngFor="let zone of zones; trackBy: trackZone">
				<deck-zone
					[zone]="zone"
					[tooltipPosition]="_tooltipPosition"
					[colorManaCost]="colorManaCost"
				></deck-zone>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListByZoneComponent {
	@Input() colorManaCost: boolean;
	zones: readonly DeckZone[];
	_tooltipPosition: CardTooltipPositionType;

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		// console.log('[deck-list-by-zone] setting tooltip position', value);
		this._tooltipPosition = value;
	}

	@Input('deckState') set deckState(deckState: DeckState) {
		const zones = [
			this.buildZone(deckState.deck, 'deck', 'In your deck', (a, b) => a.manaCost - b.manaCost),
			this.buildZone(deckState.hand, 'hand', 'In your hand', (a, b) => a.manaCost - b.manaCost, null, 'in-hand'),
		];
		// If there are no dynamic zones, we use the standard "other" zone
		if (deckState.dynamicZones.length === 0) {
			const otherZone = [...deckState.otherZone, ...deckState.board];
			zones.push(
				this.buildZone(
					otherZone,
					'other',
					'Other',
					(a, b) => a.manaCost - b.manaCost,
					// We want to keep the info in the deck state (that there are cards in the SETASIDE zone) but
					// not show them in the zones
					(a: VisualDeckCard) => a.zone !== 'SETASIDE',
				),
			);
		}
		// Otherwise, we add all the dynamic zones
		deckState.dynamicZones.forEach(zone => {
			zones.push(this.buildDynamicZone(zone, (a, b) => a.manaCost - b.manaCost));
		});
		this.zones = zones as readonly DeckZone[];
	}

	trackZone(index, zone: DeckZone) {
		return zone.id;
	}

	private buildDynamicZone(
		zone: DynamicZone,
		sortingFunction: (a: VisualDeckCard, b: VisualDeckCard) => number,
	): DeckZone {
		return {
			id: zone.id,
			name: zone.name,
			cards: zone.cards.map(card =>
				Object.assign(new VisualDeckCard(), card, {
					creatorCardIds: (card.creatorCardId ? [card.creatorCardId] : []) as readonly string[],
				} as VisualDeckCard),
			),
			sortingFunction: sortingFunction,
		} as DeckZone;
	}

	private buildZone(
		cards: readonly DeckCard[],
		id: string,
		name: string,
		sortingFunction: (a: VisualDeckCard, b: VisualDeckCard) => number,
		filterFunction?: (a: VisualDeckCard) => boolean,
		highlight?: string,
	): DeckZone {
		return {
			id: id,
			name: name,
			cards: cards
				.map(card =>
					Object.assign(new VisualDeckCard(), card, {
						creatorCardIds: (card.creatorCardId ? [card.creatorCardId] : []) as readonly string[],
						highlight: highlight,
					} as VisualDeckCard),
				)
				.filter(card => !filterFunction || filterFunction(card)),
			sortingFunction: sortingFunction,
		} as DeckZone;
	}
}
