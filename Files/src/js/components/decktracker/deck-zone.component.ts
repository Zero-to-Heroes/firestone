import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { DeckZone } from '../../models/decktracker/view/deck-zone';
import { DeckCard } from '../../models/decktracker/deck-card';

@Component({
	selector: 'deck-zone',
	styleUrls: [
		'../../../css/global/components-global.scss',
		'../../../css/component/decktracker/deck-zone.component.scss',
		'../../../css/component/decktracker/dim-overlay.scss',
	],
	template: `
		<div class="deck-zone {{className}}">
			<div class="zone-name-container" *ngIf="zoneName">
				<span class="zone-name">{{zoneName}}</span>
				<!-- TODO: collapse caret -->
				<div class="dim-overlay" *ngIf="activeTooltip"></div>
			</div>
			<ul class="card-list">
				<li *ngFor="let card of cards; trackBy: trackCard">
					<deck-card [activeTooltip]="activeTooltip" [card]="card"></deck-card>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckZoneComponent {

	@Input() activeTooltip: string;
	className: string;
	zoneName: string;
	cards: ReadonlyArray<DeckCard>;

	@Input('zone') set zone(zone: DeckZone) {
		this.className = zone.id;
		this.zoneName = zone.name;
		this.cards = zone.sortingFunction
				? [...zone.cards].sort(zone.sortingFunction)
				: zone.cards;
	}

	trackCard(index, card: DeckCard) {
		return card.cardId;
	}
}