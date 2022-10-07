import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ComponentRef,
	Input,
	OnDestroy,
	Optional,
	ViewRef,
} from '@angular/core';
import { DeckCard } from '../../models/decktracker/deck-card';
import { CardsFacadeService } from '../../services/cards-facade.service';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

@Component({
	selector: 'card-tooltip',
	styleUrls: [`../../../css/component/tooltip/card-tooltip.component.scss`],
	template: `
		<div
			class="card-tooltip {{ card.additionalClass }}"
			*ngFor="let card of cards"
			[ngClass]="{ 'hidden': !_relativePosition }"
		>
			<div *ngIf="card.createdBy" class="created-by">Created by</div>
			<img *ngIf="card.image" [src]="card.image" (onload)="refresh()" class="tooltip-image" />
			<!-- <video *ngIf="card.cardType === 'GOLDEN'" #videoPlayer loop="loop" [autoplay]="true" [preload]="true">
				<source
					src="{{
						'https://static.zerotoheroes.com/hearthstone/fullcard/en/golden/' + card.cardId + '.webm'
					}}"
					type="video/webm"
				/>
			</video> -->
			<!-- <div *ngIf="card.text" class="text">{{ card.text }}</div> -->
			<div class="buffs" *ngIf="card.buffs && _displayBuffs" [ngClass]="{ 'only-buffs': !card.image }">
				<div class="background">
					<div class="body"></div>
					<div class="bottom"></div>
				</div>
				<div class="content">
					<buff-info *ngFor="let buff of card.buffs" [buff]="buff"></buff-info>
				</div>
			</div>
		</div>
		<div
			class="related-cards-wrapper"
			*ngIf="relatedCards.length"
			[ngClass]="{
				'left': _relativePosition === 'left',
				'hidden': !_relativePosition
			}"
		>
			<div class="related-cards-container" [ngClass]="{ 'wide': relatedCards.length > 6 }">
				<div class="related-cards">
					<div class="related-card" *ngFor="let card of relatedCards">
						<img *ngIf="card.image" [src]="card.image" class="tooltip-image" />
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardTooltipComponent
	extends AbstractSubscriptionComponent
	implements AfterViewInit, OnDestroy, AfterContentInit {
	cards: readonly InternalCard[];
	relatedCards: readonly InternalCard[] = [];
	_displayBuffs: boolean;
	_relativePosition: 'left' | 'right';

	public viewRef: ComponentRef<CardTooltipComponent>;

	private _cardIds: string[];
	private _relatedCardIds: readonly string[] = [];
	private isBgs: boolean;
	private _additionalClass: string;
	private createdBy: boolean;
	private buffs: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	private _cardType: 'NORMAL' | 'GOLDEN' = 'NORMAL';

	// Call last in directive
	@Input() set cardId(value: string) {
		this._cardIds = value?.length ? value.split(',') : [];
		this.updateInfos();
	}

	@Input() set relatedCardIds(value: readonly string[]) {
		this._relatedCardIds = value ?? [];
	}

	@Input() set cardType(value: 'NORMAL' | 'GOLDEN') {
		this._cardType = value;
	}

	@Input() set cardTooltipBgs(value: boolean) {
		this.isBgs = value;
	}

	// Position of the tooltip relative to its origin element
	@Input() set relativePosition(value: 'left' | 'right') {
		this._relativePosition = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() localized = true;

	@Input() set cardTooltipCard(value: DeckCard) {
		if (!value) {
			this.updateInfos();
			return;
		}

		this.buffs =
			!value.buffCardIds || value.buffCardIds.length === 0
				? undefined
				: Object.values(groupByFunction((buffCardId: string) => buffCardId)(value.buffCardIds))
						.map((buff: string[]) => buff ?? [])
						.map((buff: string[]) => buff.filter((b) => !!b))
						.filter((buff: string[]) => !!buff?.length)
						.map((buff: string[]) => ({
							buffCardId: buff[0],
							bufferCardId: buff[0].slice(0, buff[0].length - 1),
							count: buff.length,
						}));
		this.createdBy = (value.creatorCardId || value.lastAffectedByCardId) && !value.cardId;
		this._cardIds = [value.cardId || value.creatorCardId || value.lastAffectedByCardId];
		this.updateInfos();
	}

	@Input() set additionalClass(value: string) {
		this._additionalClass = value;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	@Input() set displayBuffs(value: boolean) {
		this._displayBuffs = value;
	}

	@Input() set text(value: string) {
		// this._text = value;
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
	}

	private timeout;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
		@Optional() private prefs: PreferencesService,
	) {
		super(store, cdr);
	}

	ngAfterViewInit(): void {
		this.timeout = setTimeout(() => this.viewRef?.destroy(), 15_000);
	}

	ngOnDestroy(): void {
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
	}

	ngAfterContentInit(): void {
		this.listenForBasicPref$((prefs) => prefs.locale).subscribe((info) => this.updateInfos());
	}

	refresh() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private async updateInfos() {
		if (!this._cardIds?.length && !this._relatedCardIds?.length) {
			return;
		}

		const highRes = (await this.prefs?.getPreferences())?.collectionUseHighResImages;
		// There can be multiple cardIds, in the case of normal + golden card tooltip for instance
		this.cards = (this._cardIds ?? [])
			// Empty card IDs are necessary when showing buff only
			// .filter((cardId) => cardId)
			.reverse()
			.map((cardId) => {
				const card = this.allCards.getCard(cardId);
				const isPremium =
					cardId?.endsWith('_golden') || this._cardType === 'GOLDEN' || !!card.battlegroundsNormalDbfId;
				const realCardId = cardId?.split('_golden')[0];
				const image = !!realCardId
					? this.localized
						? this.i18n.getCardImage(realCardId, {
								isBgs: this.isBgs,
								isPremium: isPremium,
								isHighRes: highRes,
						  })
						: this.i18n.getNonLocalizedCardImage(realCardId)
					: null;
				const result = {
					cardId: realCardId,
					image: image,
					// For now there are no cases where we have multiple card IDs, and different buffs for
					// each one. If the case arises, we'll have to handle this differently
					buffs: this.buffs,
					cardType: this._cardType,
					createdBy: this.createdBy,
					additionalClass: this._additionalClass,
				};
				return result;
			});
		this.relatedCards = this._relatedCardIds.map((cardId) => {
			const image = !!cardId
				? this.localized
					? this.i18n.getCardImage(cardId, {
							isBgs: this.isBgs,
							isHighRes: highRes,
					  })
					: this.i18n.getNonLocalizedCardImage(cardId)
				: null;
			return {
				cardId: cardId,
				image: image,
				cardType: 'NORMAL',
			};
		});
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}

interface InternalCard {
	readonly cardId: string;
	readonly image: string;
	readonly cardType: 'NORMAL' | 'GOLDEN';

	readonly createdBy?: boolean;
	readonly buffs?: readonly { bufferCardId: string; buffCardId: string; count: number }[];
	readonly additionalClass?: string;
}
