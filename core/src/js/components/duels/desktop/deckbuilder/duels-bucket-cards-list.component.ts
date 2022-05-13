import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input } from '@angular/core';
import { SetCard } from '@models/set';

@Component({
	selector: 'duels-bucket-cards-list',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../../../css/component/duels/desktop/deckbuilder/duels-bucket-cards-list.component.scss',
	],
	template: `
		<perfect-scrollbar class="cards-list active" scrollable>
			<duels-bucket-card
				class="card"
				*ngFor="let card of _cards; trackBy: trackByCard"
				[card]="card"
			></duels-bucket-card>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsBucketCardsListComponent {
	@Input() set cards(value: readonly BucketCard[]) {
		this._cards = value;
	}

	@Input() collection: readonly SetCard[];

	_cards: readonly BucketCard[];
	isScroll: boolean;

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	trackByCard(index: number, item: BucketCard) {
		return item.cardId;
	}
}

export interface BucketCard {
	readonly cardId: string;
	readonly cardName: string;
	readonly manaCost: number;
	readonly rarity: string;
	readonly offeringRate: number;
	readonly totalBuckets: number;
}
