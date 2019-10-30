import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';

@Component({
	selector: 'deck-zone',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/deck-zone.component.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
	],
	template: `
		<div class="deck-zone {{ className }}">
			<div class="zone-name-container" *ngIf="zoneName" (mousedown)="toggleZone()">
				<span class="zone-name">{{ zoneName }} ({{ cardsInZone }})</span>
				<!-- TODO: collapse caret -->
				<i class="collapse-caret {{ open ? 'open' : 'close' }}">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#collapse_caret" />
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
	cardsInZone = 0;
	cards: readonly VisualDeckCard[];
	open = true;

	constructor(private cdr: ChangeDetectorRef) {}

	@Input('zone') set zone(zone: DeckZone) {
		this.className = zone.id;
		this.zoneName = zone.name;
		// console.log('setting zone', zone);
		const cardsToDisplay = zone.sortingFunction ? [...zone.cards].sort(zone.sortingFunction) : zone.cards;
		this.cardsInZone = cardsToDisplay.length;
		// console.log('setting cards in zone', zone, cardsToDisplay, this.cardsInZone);
		const grouped: Map<string, VisualDeckCard[]> = this.groupBy(
			cardsToDisplay,
			(card: VisualDeckCard) => card.cardId,
		);
		this.cards = Array.from(grouped.values(), cards => {
			const creatorCardIds: readonly string[] = [
				...new Set(
					cards
						.map(card => card.creatorCardIds)
						.reduce((a, b) => a.concat(b), [])
						.filter(creator => creator),
				),
			];
			// console.log('creator card ids', creatorCardIds, cards);
			return Object.assign(new VisualDeckCard(), cards[0], {
				totalQuantity: cards.length,
				creatorCardIds: creatorCardIds,
			} as VisualDeckCard);
		});
		// console.log('setting cards in zone', zone, cardsToDisplay, this.cardsInZone, this.cards, grouped);
	}

	toggleZone() {
		this.open = !this.open;
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	trackCard(index, card: VisualDeckCard) {
		return card.cardId;
	}

	private groupBy(list, keyGetter): Map<string, VisualDeckCard[]> {
		const map = new Map();
		list.forEach(item => {
			const key = keyGetter(item);
			const collection = map.get(key);
			if (!collection) {
				map.set(key, [item]);
			} else {
				collection.push(item);
			}
		});
		return map;
	}
}
