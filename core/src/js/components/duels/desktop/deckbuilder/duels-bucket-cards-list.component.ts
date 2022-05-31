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
				(click)="onBucketCardClick(card)"
			></duels-bucket-card>
		</perfect-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsBucketCardsListComponent {
	@Output() cardClick = new EventEmitter<BucketCard>();
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

	onBucketCardClick(card: BucketCard) {
		console.debug('clicking on card', card);
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
}
