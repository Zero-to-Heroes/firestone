import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardsFacadeService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'check-off-cards-list',
	styleUrls: [`./check-off-cards-list.component.scss`],
	template: `
		<div class="check-off-cards-list scalable" *ngIf="cards?.length">
			<div class="title" *ngIf="title">{{ title }}</div>
			<div class="text" *ngIf="text">{{ text }}</div>
			<ul class="deck-list">
				<li class="card-container" *ngFor="let card of cards" [ngClass]="{ checked: card.checked }">
					<card-tile class="card" [cardId]="card.cardId" [numberOfCopies]="card.quantity"></card-tile>
					<div class="sideboard" *ngIf="card.sideboard">
						<card-tile
							*ngFor="let sideboard of card.sideboard"
							class="card"
							[cardId]="sideboard.cardId"
						></card-tile>
					</div>
				</li>
			</ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckOffCardsListComponent {
	cards: readonly CheckOffCard[];
	title: string | undefined;
	text: string | undefined;

	@Input() set config(value: CheckOffCardsListConfig) {
		this.cards = value.cards;
		this.title = value.title;
		this.text = value.text;
	}

	constructor(private readonly allCards: CardsFacadeService) {}
}

export interface CheckOffCard {
	readonly cardId: string;
	readonly quantity: number;
	readonly sideboard?: readonly CheckOffCard[];
	readonly checked: boolean;
}
export interface CheckOffCardsListConfig {
	readonly title?: string;
	readonly text?: string;
	readonly cards: readonly CheckOffCard[];
}
