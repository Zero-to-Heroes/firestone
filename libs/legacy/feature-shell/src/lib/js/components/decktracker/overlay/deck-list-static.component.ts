import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
} from '@angular/core';
import { Sideboard, decode } from '@firestone-hs/deckstrings';
import {
	AbstractSubscriptionStoreComponent,
	IPreferences,
	NonFunctionProperties,
	Store,
	sortByProperties,
	uuid,
} from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { BehaviorSubject, Observable, combineLatest, filter } from 'rxjs';
import { Card } from '../../../models/card';
import { SetCard } from '../../../models/set';
import { getOwnedForDeckBuilding } from '../../../services/collection/collection-utils';
import { CardsHighlightFacadeService } from '../../../services/decktracker/card-highlight/cards-highlight-facade.service';

@Component({
	selector: 'deck-list-static',
	styleUrls: [
		`../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../../css/global/scrollbar-cards-list.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		'../../../../css/component/decktracker/overlay/deck-list-static.component.scss',
	],
	template: `
		<ng-scrollbar
			class="deck-list"
			*ngIf="{ colorManaCost: colorManaCost$ | async } as value"
			[autoHeightDisabled]="false"
			[sensorDisabled]="false"
			scrollable
		>
			<li class="card-container" *ngFor="let card of cards$ | async">
				<deck-card
					class="card"
					[card]="card"
					[colorManaCost]="value.colorManaCost"
					[showRelatedCards]="true"
					[side]="'player'"
					(cardClicked)="onCardClicked($event)"
				></deck-card>
				<div class="sideboard" *ngIf="card.sideboard">
					<deck-card
						*ngFor="let sideboard of card.sideboard"
						class="card"
						[card]="sideboard"
						[colorManaCost]="value.colorManaCost"
						[showRelatedCards]="true"
						[side]="'player'"
						(cardClicked)="onCardClicked($event)"
					></deck-card>
				</div>
			</li>
		</ng-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListStaticComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	cards$: Observable<readonly CardWithSideboard[]>;
	colorManaCost$: Observable<boolean>;

	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	@Input() set deckstring(value: string) {
		this.deckstring$$.next(value);
	}

	@Input() set cards(value: readonly MinimalCard[]) {
		this.cards$$.next(value);
	}

	@Input() set collection(value: readonly (Card | SetCard)[]) {
		if (!value?.length) {
			this.normalizedCollection$$?.next(null);
			return;
		}

		const normalizedValues: { [cardId: string]: Card } = {};
		if ((value[0] as SetCard).ownedNonPremium !== undefined) {
			for (const card of value) {
				const setCard = card as SetCard;
				const result: Card = {
					id: card.id,
					count: setCard.ownedNonPremium,
					premiumCount: setCard.ownedPremium,
					diamondCount: setCard.ownedDiamond,
					signatureCount: setCard.ownedSignature,
				};
				normalizedValues[card.id] = result;
			}
		} else {
			for (const card of value) {
				normalizedValues[card.id] = card as Card;
			}
		}
		this.normalizedCollection$$.next(normalizedValues);
	}

	private deckstring$$ = new BehaviorSubject<string>(null);
	private cards$$ = new BehaviorSubject<readonly MinimalCard[]>([]);
	private normalizedCollection$$ = new BehaviorSubject<{ [cardId: string]: Card }>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		protected override readonly store: Store<IPreferences>,
		private readonly allCards: CardsFacadeService,
		private readonly highglight: CardsHighlightFacadeService,
	) {
		super(store, cdr);
		this.highglight.init({
			skipGameState: true,
			skipPrefs: true,
			uniqueZone: true,
		});
	}

	ngAfterContentInit(): void {
		this.colorManaCost$ = this.listenForBasicPref$((prefs) => prefs.overlayShowRarityColors);
		this.deckstring$$
			.pipe(
				filter((deckstring) => !!deckstring?.length),
				this.mapData((deckstring) => this.buildCardsFromDeckstring(deckstring)),
			)
			.subscribe(this.cards$$);
		this.cards$ = combineLatest([this.cards$$, this.normalizedCollection$$]).pipe(
			filter(([deckCards, collection]) => !!deckCards?.length),
			this.mapData(([deckCards, collection]) => this.buildCards(deckCards, collection)),
		);
	}

	onCardClicked(card: VisualDeckCard) {
		this.cardClicked.next(card);
	}

	private buildCardsFromDeckstring(deckstring: string): readonly MinimalCard[] {
		if (!deckstring?.length) {
			return [];
		}

		const decklist = decode(deckstring);
		return decklist.cards.map((pair) => {
			const cardDbfId = pair[0];
			const quantity = pair[1];
			const card = this.allCards.getCard(cardDbfId);
			const sideboardFromList = decklist.sideboards?.find((s) => s.keyCardDbfId === cardDbfId);
			const sideboard = this.buildMinimalSideboard(sideboardFromList);
			return {
				cardId: card.id,
				quantity: quantity,
				sideboard: sideboard,
			};
		});
	}

	private buildCards(
		deckCards: readonly MinimalCard[],
		collection: { [cardId: string]: Card },
	): readonly VisualDeckCard[] {
		return deckCards
			.map((miniCard) => {
				const card = this.allCards.getCard(miniCard.cardId);
				const sideboard = this.buildSideboard(miniCard.sideboard);
				const internalEntityId = uuid();
				const inCollection =
					collection == null
						? true
						: getOwnedForDeckBuilding(card.id, collection, this.allCards) >= miniCard.quantity;
				return CardWithSideboard.create({
					cardId: card.id,
					cardName: card.name,
					manaCost: card.cost,
					rarity: card.rarity,
					totalQuantity: miniCard.quantity,
					sideboard: sideboard,
					isMissing: !inCollection,
					internalEntityId: internalEntityId,
					internalEntityIds: [internalEntityId],
				});
			})
			.sort(sortByProperties((c: CardWithSideboard) => [c.manaCost, c.cardName]));
	}

	private buildMinimalSideboard(sideboardFromList: Sideboard): readonly MinimalCard[] {
		if (!sideboardFromList) {
			return null;
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

	private buildSideboard(sideboardFromList: readonly MinimalCard[]): readonly VisualDeckCard[] {
		if (!sideboardFromList?.length) {
			return null;
		}

		return sideboardFromList
			.map((miniCard) => {
				const card = this.allCards.getCard(miniCard.cardId);
				const internalEntityId = uuid();
				return VisualDeckCard.create({
					cardId: card.id,
					cardName: card.name,
					manaCost: card.cost,
					rarity: card.rarity,
					totalQuantity: miniCard.quantity,
					internalEntityId: internalEntityId,
					internalEntityIds: [internalEntityId],
				});
			})
			.sort((a, b) => a.manaCost - b.manaCost);
	}
}

class CardWithSideboard extends VisualDeckCard {
	readonly sideboard?: readonly VisualDeckCard[];

	public static create(base: Partial<NonFunctionProperties<CardWithSideboard>>): CardWithSideboard {
		return Object.assign(new CardWithSideboard(), base);
	}
}

export interface MinimalCard {
	readonly cardId: string;
	readonly quantity: number;
	readonly sideboard?: readonly MinimalCard[];
}
