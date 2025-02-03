import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Inject,
	Input,
	Optional,
	ViewRef,
} from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { uuidShort } from '@firestone/shared/framework/common';
import {
	CARDS_HIGHLIGHT_SERVICE_TOKEN,
	CardsFacadeService,
	ICardsHighlightService,
} from '@firestone/shared/framework/core';

@Component({
	selector: 'card-tile',
	styleUrls: ['./card-tile.component.scss'],
	template: `
		<div
			class="deck-card {{ rarity }} {{ cardClass }} {{ linkedCardHighlight }}"
			[ngClass]="{
				'color-mana-cost': true,
				'color-class-cards': false,
				'linked-card': linkedCardHighlight
			}"
			[cardTooltip]="_cardId"
			[cardTooltipPosition]="'auto'"
			[cardTooltipShowRelatedCards]="true"
			[cardTooltipRelatedCardIds]="relatedCardIds"
			(mouseenter)="onMouseEnter()"
			(mouseleave)="onMouseLeave()"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="mana-cost">
				<span>{{ manaCostStr }}</span>
			</div>
			<div class="missing-overlay"></div>
			<div class="gradiant"></div>
			<div class="card-name">
				<span>{{ cardName }}</span>
			</div>
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{ numberOfCopies }}</span>
				</div>
			</div>
			<div class="legendary-symbol" *ngIf="rarity === 'legendary'">
				<div class="inner-border">
					<div class="svg-container" inlineSVG="assets/svg/card_legendary.svg"></div>
				</div>
			</div>
			<div class="linked-card-overlay"></div>
			<div class="mouse-over"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTileComponent {
	@Input() set cardId(value: string) {
		this._cardId = value;
		const refCard: ReferenceCard = this.allCards.getCard(value);
		this.rarity = refCard.rarity?.toLowerCase();
		this.cardClass = refCard.classes?.[0]?.toLowerCase();
		this.relatedCardIds = refCard.relatedCardDbfIds?.map((dbfId) => this.allCards.getCard(dbfId).id) ?? [];
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${value}.jpg)`;
		this.manaCostStr = refCard.hideStats ? '' : refCard.cost?.toString() ?? '?';
		this.cardName = refCard.name;

		this.registerHighlight();
	}
	@Input() numberOfCopies: number;

	_cardId: string;
	cardImage: string;
	manaCostStr: string;
	cardName: string;
	rarity: string | null;
	cardClass: string | null;
	relatedCardIds: readonly string[];
	linkedCardHighlight: boolean | string;

	private _uniqueId: string;
	private _referenceCard: ReferenceCard;

	constructor(
		private readonly allCards: CardsFacadeService,
		@Inject(CARDS_HIGHLIGHT_SERVICE_TOKEN)
		@Optional()
		private readonly cardsHighlightService: ICardsHighlightService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.cardsHighlightService?.onMouseLeave(this._cardId);
		this.cardsHighlightService?.unregister(this._uniqueId, 'single');
	}

	onMouseEnter() {
		// console.debug('mouse enter', this._cardId, this.cardsHighlightService);
		this.cardsHighlightService?.onMouseEnter(this._cardId, 'single');
	}

	onMouseLeave() {
		this.cardsHighlightService?.onMouseLeave(this._cardId);
	}

	doHighlight(highlight: any /*SelectorOutput*/) {
		this.linkedCardHighlight = highlight === true ? true : highlight === false ? false : 'linked-card-' + highlight;
		// console.debug('highlighting', this._cardId);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	doUnhighlight() {
		this.linkedCardHighlight = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private registerHighlight() {
		this._uniqueId = uuidShort();
		this._referenceCard = this.allCards.getCard(this._cardId);
		this.cardsHighlightService?.register(
			this._uniqueId,
			{
				referenceCardProvider: () => this._referenceCard,
				deckCardProvider: () => ({
					cardId: this._cardId,
					internalEntityId: this._uniqueId,
					internalEntityIds: [this._uniqueId],
				}),
				zoneProvider: () => null,
				side: () => 'single',
				highlightCallback: (highlight: any /*SelectorOutput*/) => this.doHighlight(highlight),
				unhighlightCallback: () => this.doUnhighlight(),
				debug: this,
			} /*as Handler*/,
			'single',
		);
		// console.debug('registering highlight', this._card?.cardId, this.el.nativeElement);
	}
}
