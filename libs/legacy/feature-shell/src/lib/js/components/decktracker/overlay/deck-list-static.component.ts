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
import { BehaviorSubject, Observable, filter } from 'rxjs';
import { SetCard } from '../../../models/set';
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
		this.deckstring$.next(value);
	}

	@Input() collection: readonly SetCard[];

	private deckstring$ = new BehaviorSubject<string>(null);

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
		this.cards$ = this.deckstring$.pipe(
			filter((deckstring) => !!deckstring?.length),
			this.mapData((deckstring) => this.buildCards(deckstring)),
		);
	}

	onCardClicked(card: VisualDeckCard) {
		this.cardClicked.next(card);
	}

	private buildCards(deckstring: string): readonly VisualDeckCard[] {
		const decklist = decode(deckstring);
		return decklist.cards
			.map((pair) => {
				const cardDbfId = pair[0];
				const quantity = pair[1];
				const card = this.allCards.getCard(cardDbfId);
				const sideboardFromList = decklist.sideboards?.find((s) => s.keyCardDbfId === cardDbfId);
				const sideboard = this.buildSideboard(sideboardFromList);
				const internalEntityId = uuid();
				return CardWithSideboard.create({
					cardId: card.id,
					cardName: card.name,
					manaCost: card.cost,
					rarity: card.rarity,
					totalQuantity: quantity,
					sideboard: sideboard,
					internalEntityId: internalEntityId,
					internalEntityIds: [internalEntityId],
				});
			})
			.sort(sortByProperties((c: CardWithSideboard) => [c.manaCost, c.cardName]));
	}

	private buildSideboard(sideboardFromList: Sideboard): readonly VisualDeckCard[] {
		if (!sideboardFromList) {
			return null;
		}

		return sideboardFromList.cards
			.map((pair) => {
				const cardDbfId = pair[0];
				const quantity = pair[1];
				const card = this.allCards.getCard(cardDbfId);
				const internalEntityId = uuid();
				return VisualDeckCard.create({
					cardId: card.id,
					cardName: card.name,
					manaCost: card.cost,
					rarity: card.rarity,
					totalQuantity: quantity,
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
