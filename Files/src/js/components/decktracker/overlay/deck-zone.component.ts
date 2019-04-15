import { Component, ChangeDetectionStrategy, Input, ChangeDetectorRef } from '@angular/core';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { DeckCard } from '../../../models/decktracker/deck-card';

@Component({
	selector: 'deck-zone',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/deck-zone.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
	],
	template: `
		<div class="deck-zone {{className}}">
			<div class="zone-name-container" *ngIf="zoneName" (click)="toggleZone()">
				<span class="zone-name">{{zoneName}} ({{cardsInZone}})</span>
				<!-- TODO: collapse caret -->
				<i class="collapse-caret {{open ? 'open' : 'close'}}">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#collapse_caret"/>
					</svg>
				</i>
				<div class="dim-overlay" *ngIf="activeTooltip"></div>
			</div>
			<ul class="card-list" *ngIf="open">
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
    cardsInZone: number = 0;
	cards: ReadonlyArray<DeckCard>;
	open: boolean = true;

	constructor(private cdr: ChangeDetectorRef) {

	}

	@Input('zone') set zone(zone: DeckZone) {
		this.className = zone.id;
		this.zoneName = zone.name;
		this.cards = zone.sortingFunction
				? [...zone.cards].sort(zone.sortingFunction)
                : zone.cards;
        this.cardsInZone = this.cards.map((card) => card.totalQuantity).reduce((a, b) => a + b, 0);
	}

	toggleZone() {
		this.open = !this.open;
		this.cdr.detectChanges();
	}

	trackCard(index, card: DeckCard) {
		return card.cardId;
	}
}