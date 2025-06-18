import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, Input } from '@angular/core';
import { Sideboard, decode } from '@firestone-hs/deckstrings';
import { AbstractSubscriptionComponent, sortByProperties } from '@firestone/shared/framework/common';
import {
	CARDS_HIGHLIGHT_SERVICE_TOKEN,
	CardsFacadeService,
	ICardsHighlightService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, Observable, filter, tap } from 'rxjs';

@Component({
	selector: 'deck-list-basic',
	styleUrls: [`./deck-list-basic.component.scss`],
	template: `
		<ng-scrollbar class="deck-list" [autoHeightDisabled]="false" [sensorDisabled]="false" scrollable>
			<li class="card-container" *ngFor="let card of cards$ | async">
				<card-tile class="card" [cardId]="card.cardId" [numberOfCopies]="card.quantity"></card-tile>
				<div class="sideboard" *ngIf="card.sideboard">
					<card-tile
						*ngFor="let sideboard of card.sideboard"
						class="card"
						[cardId]="sideboard.cardId"
					></card-tile>
				</div>
			</li>
		</ng-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListBasicComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	cards$: Observable<readonly MinimalCard[]>;

	@Input() set deckstring(value: string) {
		this.deckstring$$.next(value);
	}

	private deckstring$$ = new BehaviorSubject<string | null>(null);
	private cards$$ = new BehaviorSubject<readonly MinimalCard[]>([]);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		@Inject(CARDS_HIGHLIGHT_SERVICE_TOKEN) private readonly highlight: ICardsHighlightService,
	) {
		super(cdr);
		this.highlight.init({
			skipGameState: true,
			skipPrefs: true,
			uniqueZone: true,
		});
	}

	ngAfterContentInit(): void {
		this.cards$ = this.cards$$.asObservable();
		this.deckstring$$
			.pipe(
				tap((deckstring) => console.debug('[deck-list-basic] received deckstring', deckstring)),
				filter((deckstring) => !!deckstring?.length),
				this.mapData((deckstring) => this.buildCardsFromDeckstring(deckstring)),
				tap((cards) => console.debug('[deck-list-basic] built cards', cards)),
			)
			.subscribe(this.cards$$);
	}

	private buildCardsFromDeckstring(deckstring: string | null): readonly MinimalCard[] {
		if (!deckstring?.length) {
			return [];
		}

		const decklist = decode(deckstring);
		return decklist.cards
			.map((pair) => {
				const cardDbfId = pair[0];
				const quantity = pair[1];
				const card = this.allCards.getCard(cardDbfId);
				const sideboardFromList = decklist.sideboards?.find((s) => s.keyCardDbfId === cardDbfId);
				const sideboard = this.buildMinimalSideboard(sideboardFromList);
				return {
					cardId: card.id,
					name: card.name,
					cost: card.cost,
					quantity: quantity,
					sideboard: sideboard,
				};
			})
			.sort(sortByProperties((c) => [c.cost, c.name]));
	}

	private buildMinimalSideboard(sideboardFromList: Sideboard | undefined): readonly MinimalCard[] {
		if (!sideboardFromList) {
			return [];
		}

		return sideboardFromList.cards.map((pair) => {
			const cardDbfId = pair[0];
			const quantity = pair[1];
			const card = this.allCards.getCard(cardDbfId);
			return {
				cardId: card.id,
				quantity: quantity,
			};
		});
	}
}

export interface MinimalCard {
	readonly cardId: string;
	readonly quantity: number;
	readonly sideboard?: readonly MinimalCard[];
}
