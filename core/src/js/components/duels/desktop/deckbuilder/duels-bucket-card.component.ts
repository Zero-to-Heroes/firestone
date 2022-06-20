import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, Optional } from '@angular/core';
import { BucketCard } from '@components/duels/desktop/deckbuilder/duels-bucket-cards-list.component';
import { CardsFacadeService } from '@services/cards-facade.service';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Component({
	selector: 'duels-bucket-card',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		'../../../../../css/component/duels/desktop/deckbuilder/duels-bucket-card.component.scss',
	],
	template: `
		<div
			tabindex="0"
			[attr.aria-label]="cardName"
			class="card {{ rarity }}"
			[ngClass]="{
				'color-mana-cost': true,
				'color-class-cards': false
			}"
			[cardTooltip]="cardId"
			[cardTooltipPosition]="'auto'"
		>
			<div class="background-image" [style.background-image]="cardImage"></div>
			<div class="mana-cost">
				<span>{{ manaCost === undefined ? '?' : manaCost }}</span>
			</div>
			<div class="gradiant"></div>
			<div class="card-name">
				<span>{{ cardName }}</span>
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
			<!-- <div class="number-of-copies" *ngIf="numberOfCopies > 1">
				<div class="inner-border">
					<span>{{ numberOfCopies }}</span>
				</div>
			</div> -->
		</div>
		<div class="additional-info">
			<div class="offering-rate" [helpTooltip]="'app.duels.deckbuilder.card-offering-rate-tooltip' | owTranslate">
				{{ offeringRate }}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsBucketCardComponent {
	@Input() set card(card: BucketCard) {
		this.setCardInfos(card);
	}

	cardId: string;
	cardName: string;
	manaCost: number;
	rarity: string;
	cardImage: string;
	offeringRate: string;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly cards: CardsFacadeService,
		@Optional() private readonly i18n: LocalizationFacadeService,
	) {}

	private setCardInfos(card: BucketCard) {
		this.cardId = card.cardId;
		this.cardName = card.cardName;
		this.manaCost = card.manaCost;
		this.rarity = card.rarity;
		this.cardImage = `url(https://static.zerotoheroes.com/hearthstone/cardart/tiles/${card.cardId}.jpg)`;
		this.offeringRate = card.offeringRate?.toLocaleString(this.i18n.formatCurrentLocale(), {
			maximumFractionDigits: 1,
			minimumFractionDigits: 1,
			style: 'percent',
		});
	}
}
