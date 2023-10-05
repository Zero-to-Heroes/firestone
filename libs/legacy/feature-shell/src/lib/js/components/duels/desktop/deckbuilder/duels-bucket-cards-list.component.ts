import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { sortByProperties } from '@firestone/shared/framework/common';
import { SetCard } from '@models/set';

@Component({
	selector: 'duels-bucket-cards-list',
	styleUrls: [
		`../../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../../../css/component/duels/desktop/deckbuilder/duels-bucket-cards-list.component.scss',
	],
	template: `
		<virtual-scroller class="cards-list active" #scroll [items]="_cards" scrollable>
			<duels-bucket-card
				class="card"
				*ngFor="let card of scroll.viewPortItems; trackBy: trackByCard"
				[ngClass]="{ dimmed: card.dimmed }"
				[card]="card"
				(click)="onBucketCardClick(card)"
			></duels-bucket-card>
		</virtual-scroller>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsBucketCardsListComponent {
	@Output() cardClick = new EventEmitter<BucketCard>();
	@Input() set cards(value: readonly BucketCard[]) {
		this._cards = [...value].sort(
			sortByProperties((c: BucketCard) => [
				c.dimmed,
				!c.classes.length || c.classes[0] === 'NEUTRAL' ? 'ZZZZ' : c.classes[0],
				c.manaCost,
				c.cardName,
			]),
		);
	}

	@Input() collection: readonly SetCard[];

	_cards: BucketCard[];
	isScroll: boolean;

	constructor(private readonly el: ElementRef, private readonly cdr: ChangeDetectorRef) {}

	trackByCard(index: number, item: BucketCard) {
		return item.cardId;
	}

	onBucketCardClick(card: BucketCard) {
		this.cardClick.next(card);
	}
}

export interface BucketCard {
	readonly cardId: string;
	readonly cardName: string;
	readonly manaCost: number;
	readonly rarity: string;
	readonly classes: readonly string[];
	readonly offeringRate: number;
	readonly totalBuckets: number;
	readonly dimmed?: boolean;
}
