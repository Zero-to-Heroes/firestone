import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { Sideboard, decode } from '@firestone-hs/deckstrings';
import { CardIds, GameType } from '@firestone-hs/reference-data';
import { Card } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import {
	AbstractSubscriptionComponent,
	NonFunctionProperties,
	sortByProperties,
	uuidShort,
} from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { VisualDeckCard } from '@models/decktracker/visual-deck-card';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs';
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
					[side]="'single'"
					[gameTypeOverride]="gameType"
					(cardClicked)="onCardClicked($event)"
				></deck-card>
				<div class="sideboard" *ngIf="card.sideboard">
					<deck-card
						*ngFor="let sideboard of card.sideboard"
						class="card"
						[card]="sideboard"
						[colorManaCost]="value.colorManaCost"
						[showRelatedCards]="true"
						[side]="'single'"
						[gameTypeOverride]="gameType"
						(cardClicked)="onCardClicked($event)"
					></deck-card>
				</div>
			</li>
		</ng-scrollbar>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckListStaticComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	cards$: Observable<readonly CardWithSideboard[]>;
	colorManaCost$: Observable<boolean>;

	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	@Input() gameType: GameType | null = null;

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
		private readonly allCards: CardsFacadeService,
		private readonly highglight: CardsHighlightFacadeService,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
		this.highglight.init({
			skipGameState: true,
			skipPrefs: true,
			uniqueZone: true,
		});
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.colorManaCost$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.overlayShowRarityColors));
		this.deckstring$$
			.pipe(
				filter((deckstring) => !!deckstring?.length),
				this.mapData((deckstring) => this.buildCardsFromDeckstring(deckstring)),
			)
			.subscribe(this.cards$$);
		this.deckstring$$
			.pipe(
				filter((deckstring) => !!deckstring?.length),
				distinctUntilChanged(),
				map((deckstring) => decode(deckstring)),
				map((deck) => deck.heroes?.[0]),
				filter((heroDbfId) => !!heroDbfId),
				take(1),
				takeUntil(this.destroyed$),
			)
			.subscribe((heroDbfId) => {
				this.highglight.forceHeroCardId(this.allCards.getCard(heroDbfId).id);
			});
		this.cards$ = combineLatest([this.cards$$, this.normalizedCollection$$]).pipe(
			filter(([deckCards, collection]) => !!deckCards?.length),
			this.mapData(([deckCards, collection]) => this.buildCards(deckCards, collection)),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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
				const internalEntityId = uuidShort();
				const inCollection =
					collection == null
						? true
						: getOwnedForDeckBuilding(card.id, collection, this.allCards) >= miniCard.quantity;
				const cardCost =
					card.id === CardIds.ZilliaxDeluxe3000_TOY_330
						? sideboard?.map((c) => c.refManaCost).reduce((a, b) => a + b, 0) ?? 0
						: card.cost;
				return CardWithSideboard.create({
					cardId: card.id,
					cardName: card.name,
					refManaCost: card.hideStats ? null : cardCost,
					rarity: card.rarity,
					totalQuantity: miniCard.quantity,
					sideboard: sideboard,
					isMissing: !inCollection,
					internalEntityId: internalEntityId,
					internalEntityIds: [internalEntityId],
				});
			})
			.sort(sortByProperties((c: CardWithSideboard) => [c.refManaCost, c.cardName]));
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
				const internalEntityId = uuidShort();
				return VisualDeckCard.create({
					cardId: card.id,
					cardName: card.name,
					refManaCost: card.cost,
					rarity: card.rarity,
					totalQuantity: miniCard.quantity,
					internalEntityId: internalEntityId,
					internalEntityIds: [internalEntityId],
				});
			})
			.sort(sortByProperties((a: VisualDeckCard) => [a.refManaCost]));
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
