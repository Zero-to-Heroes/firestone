import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { SetCard } from '@models/set';
import { sortByProperties } from '../../../../services/utils';

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
		this._cards = [...value].sort(sortByProperties((c: BucketCard) => [c.dimmed]));
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
	readonly offeringRate: number;
	readonly totalBuckets: number;
	readonly dimmed?: boolean;
}
