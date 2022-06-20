import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	Optional,
	Output,
	ViewRef,
} from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { CardsHighlightFacadeService } from '@services/decktracker/card-highlight/cards-highlight-facade.service';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';
import { DeckZone } from '../../../models/decktracker/view/deck-zone';
import { VisualDeckCard } from '../../../models/decktracker/visual-deck-card';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { uuid } from '../../../services/utils';

@Component({
	selector: 'deck-card',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/decktracker/overlay/dim-overlay.scss',
		'../../../../css/component/decktracker/overlay/deck-card.component.scss',
	],
	template: `
		<div
			tabindex="0"
			[attr.aria-label]="cardName"
			class="deck-card {{ rarity }} {{ highlight }} {{ cardClass }}"
			*ngIf="!isUnknownCard || _showUnknownCards"
			[ngClass]="{
				'color-mana-cost': _colorManaCost,
				'color-class-cards': _colorClassCards,
				'missing': _isMissing,
				'linked-card': isLinkedCardHighlight
			}"
			[cardTooltip]="cardId"
			[cardTooltipPosition]="'auto'"
			[cardTooltipShowRelatedCards]="_showRelatedCards"
			[cardTooltipRelatedCardIds]="relatedCardIds"
			(mouseenter)="onMouseEnter($event)"
			(mouseleave)="onMouseLeave($event)"
			(click)="onCardClicked($event)"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="mana-cost" [ngClass]="{ 'cost-reduction': manaCostReduction }">
				<span>{{ manaCost === undefined ? '?' : manaCost }}</span>
			</div>
			<div class="missing-overlay" *ngIf="_isMissing"></div>
			<div class="gradiant"></div>
			<div class="card-name">
				<span>{{ cardName }}</span>
			</div>
			<div
				class="icon-symbol"
				*ngIf="isBurned"
				[helpTooltip]="'decktracker.card-burned' | owTranslate"
				[bindTooltipToGameWindow]="true"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_burned" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol transformed"
				*ngIf="isTransformed"
				[helpTooltip]="'decktracker.card-transformed' | owTranslate"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_transformed" />
						</svg>
					</i>
				</div>
			</div>
			<div class="gift-symbol" *ngIf="creatorCardIds && creatorCardIds.length > 0" [helpTooltip]="giftTooltip">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_gift_icon" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol dredged"
				*ngIf="isDredged"
				[helpTooltip]="'decktracker.card-dredged-tooltip' | owTranslate"
			>
				<div class="inner-border">
					<div class="icon" inlineSVG="assets/svg/dredged.svg"></div>
				</div>
			</div>
			<div class="legendary-symbol" *ngIf="rarity === 'legendary'">
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#legendary_star" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol discard"
				*ngIf="isDiscarded"
				[helpTooltip]="'decktracker.card-discarded' | owTranslate"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_discarded" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol countered"
				*ngIf="isCountered"
				[helpTooltip]="'decktracker.card-countered' | owTranslate"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_burned" />
						</svg>
					</i>
				</div>
			</div>
			<div
				class="icon-symbol graveyard"
				*ngIf="isGraveyard"
				[helpTooltip]="'decktracker.card-in-graveyard' | owTranslate"
			>
				<div class="inner-border">
					<i>
						<svg>
							<use xlink:href="assets/svg/sprite.svg#card_graveyard" />
						</svg>
					</i>
				</div>
			</div>
			<!-- <div class="position-from-top" *ngIf="positionFromTop">
				<div class="inner-border">
					<span>{{ positionFromTop }}</span>
				</div>
			</div>
			<div class="position-from-bottom" *ngIf="positionFromBottom">
				<div class="inner-border">
					<span>{{ positionFromBottom }}</span>
				</div>
			</div> -->
			<div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{ numberOfCopies }}</span>
				</div>
			</div>
			<div class="dim-overlay" *ngIf="highlight === 'dim'"></div>
			<div class="linked-card-overlay"></div>
			<div class="mouse-over" [style.right.px]="mouseOverRight"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckCardComponent implements OnDestroy {
	@Output() cardClicked: EventEmitter<VisualDeckCard> = new EventEmitter<VisualDeckCard>();

	@Input() set tooltipPosition(value: CardTooltipPositionType) {
		this._tooltipPosition = value;
		this.cdr.detectChanges();
	}

	@Input() set showUpdatedCost(value: boolean) {
		this._showUpdatedCost = value;
		this.updateInfos();
	}

	@Input() set showStatsChange(value: boolean) {
		this._showStatsChange = value;
		this.updateInfos();
	}

	@Input() set card(card: VisualDeckCard) {
		this._card = card;
		this.updateInfos();
	}

	@Input() set colorManaCost(value: boolean) {
		this._colorManaCost = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set showRelatedCards(value: boolean) {
		this._showRelatedCards = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set colorClassCards(value: boolean) {
		this._colorClassCards = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set showUnknownCards(value: boolean) {
		this._showUnknownCards = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set zone(zone: DeckZone) {
		this._zone = zone;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set side(value: 'player' | 'opponent' | 'duels') {
		this._side = value;
		this.registerHighlight();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_tooltipPosition: CardTooltipPositionType;
	cardId: string;
	cardImage: string;
	manaCost: number;
	cardName: string;
	rarity: string;
	numberOfCopies: number;
	positionFromBottom: number;
	positionFromTop: number;
	highlight: string;
	isLinkedCardHighlight: boolean;
	_colorManaCost: boolean;
	_colorClassCards: boolean;
	_showRelatedCards: boolean;
	_isMissing: boolean;
	cardClass: string;
	creatorCardIds: readonly string[];
	relatedCardIds: readonly string[];
	giftTooltip: string;
	isBurned: boolean;
	isDiscarded: boolean;
	isCountered: boolean;
	isGraveyard: boolean;
	isTransformed: boolean;
	isDredged: boolean;
	manaCostReduction: boolean;
	mouseOverRight = 0;
	_showUnknownCards = true;
	isUnknownCard: boolean;

	private _showUpdatedCost: boolean;
	private _showStatsChange: boolean;
	private _card: VisualDeckCard;
	private _referenceCard: ReferenceCard;
	private _uniqueId: string;
	private _zone: DeckZone;
	private _side: 'player' | 'opponent' | 'duels';

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly cards: CardsFacadeService,
		@Optional() private readonly cardsHighlightService: CardsHighlightFacadeService,
		@Optional() private readonly i18n: LocalizationFacadeService,
	) {}

	registerHighlight() {
		this._uniqueId = uuid();
		this.cardsHighlightService?.register(
			this._uniqueId,
			{
				referenceCardProvider: () => this._referenceCard,
				deckCardProvider: () => this._card,
				zoneProvider: () => this._zone,
				highlightCallback: () => this.doHighlight(),
				unhighlightCallback: () => this.doUnhighlight(),
			},
			this._side,
		);
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.cardsHighlightService?.onMouseLeave(this.cardId);
		this.cardsHighlightService?.unregister(this._uniqueId, this._side);
	}

	doHighlight() {
		this.isLinkedCardHighlight = true;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	doUnhighlight() {
		this.isLinkedCardHighlight = false;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	onMouseEnter(event: MouseEvent) {
		this.cardsHighlightService?.onMouseEnter(this.cardId, this._side, this._card);
	}

	onMouseLeave(event: MouseEvent) {
		this.cardsHighlightService?.onMouseLeave(this.cardId);
	}

	onCardClicked(event: MouseEvent) {
		this.cardClicked.next(this._card);
	}

	private async updateInfos() {
		if (!this._card) {
			return;
		}

		this.cardId = this._card.cardId;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${this._card.cardId}.jpg)`;
		this.manaCost = this._showUpdatedCost ? this._card.getEffectiveManaCost() : this._card.manaCost;
		this.manaCostReduction = this.manaCost != null && this.manaCost < this._card.manaCost;
		this.cardName =
			(!!this._card.cardName?.length
				? this._card.cardName + this.buildSuffix(this._card)
				: this.i18n.getCardName(this.cardId) ?? this.i18n?.getUnknownCardName()) ??
			this.i18n.getUnknownCardName();
		this.isUnknownCard = !this._card.cardName?.length && !this.cardId;

		this.numberOfCopies = this._card.totalQuantity;
		this.positionFromTop = this._card.positionFromTop;
		this.rarity = this._card.rarity?.toLowerCase();
		this.creatorCardIds = this._card.creatorCardIds;
		this.giftTooltip = null;
		this.updateGiftTooltip();
		this.highlight = this._card.highlight;
		this.isDredged = this._card.dredged && !this._card.zone;
		this.relatedCardIds = this._card.relatedCardIds;

		this.isBurned = this._card.zone === 'BURNED' || this._card.milled;
		this.isDiscarded = this._card.zone === 'DISCARD';
		this.isCountered = this._card.countered;
		this.isGraveyard = this._card.zone === 'GRAVEYARD';
		this.isTransformed = this._card.zone === 'TRANSFORMED_INTO_OTHER';
		this._isMissing = this._card.isMissing;

		this.cardClass = this._card.cardClass ? this._card.cardClass.toLowerCase() : null;

		// 0 is acceptable when showing the deck as a single deck list
		if (this.numberOfCopies < 0) {
			console.error('invalid number of copies', this._card);
		}
		// Preload
		if (this.cardId) {
			const imageUrl =
				this.i18n?.getCardImage(this.cardId) ??
				`https://static.firestoneapp.com/cards/512/enUS/${this.cardId}.png`;
			const image = new Image();
			image.src = imageUrl;
			this._referenceCard = this.cards.getCard(this.cardId);
		}

		if (this.numberOfCopies > 1) {
			this.mouseOverRight += 25;
		}
		if (this.rarity === 'legendary') {
			this.mouseOverRight += 25;
		}
		if (this.creatorCardIds && this.creatorCardIds.length > 0) {
			this.mouseOverRight += 25;
		}
		if (this.isBurned) {
			this.mouseOverRight += 25;
		}
		if (this.isDiscarded) {
			this.mouseOverRight += 25;
		}
		if (this.isCountered) {
			this.mouseOverRight += 25;
		}
		if (this.isGraveyard) {
			this.mouseOverRight += 25;
		}
		if (this.isTransformed) {
			this.mouseOverRight += 25;
		}
		this.mouseOverRight = Math.min(100, this.mouseOverRight);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private buildSuffix(_card: VisualDeckCard) {
		if (!this._showStatsChange) {
			return '';
		}
		if (_card.mainAttributeChange) {
			return ` (+${_card.mainAttributeChange})`;
		}
		return '';
	}

	private updateGiftTooltip() {
		if (this.creatorCardIds && this.creatorCardIds.length === 1) {
			const creatorCard = this.cards.getCard(this.creatorCardIds[0]);
			if (creatorCard) {
				this.giftTooltip = this.i18n.translateString('decktracker.gift-created-by-single-card', {
					value: creatorCard.name,
				});
			}
		} else if (this.creatorCardIds && this.creatorCardIds.length > 1) {
			this.giftTooltip = this.i18n.translateString('decktracker.gift-created-by-multiple-cards');
		}
	}
}
