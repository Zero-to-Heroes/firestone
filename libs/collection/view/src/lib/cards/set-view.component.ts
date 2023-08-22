import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'set-view',
	styleUrls: [`./set-view.component.scss`],
	template: `
		<div class="set" [ngClass]="{ 'coming-soon': !released, 'has-hover': showHoverEffect }" (click)="browseSet()">
			<div class="logo-container">
				<img [src]="logoUrl" class="set-logo" [helpTooltip]="setName | fsTranslate" />
				<span class="text set-name" *ngIf="_displayName" [fsTranslate]="setName"></span>
			</div>
			<span
				class="cards-collected"
				*ngIf="released"
				[helpTooltip]="'app.collection.sets.total-non-golden-cards' | fsTranslate"
			>
				{{ collectedCards }}/{{ collectableCards }}
			</span>
			<span
				class="cards-collected premium"
				*ngIf="released"
				[helpTooltip]="'app.collection.sets.total-golden-cards' | fsTranslate"
			>
				{{ collectedCardsGolden }}/{{ collectableCards }}
			</span>
			<div class="frame complete-simple" *ngIf="isSimpleComplete() && !isPremiumComplete()">
				<i class="i-25 pale-gold-theme corner bottom-left">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-left">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner top-right">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
				<i class="i-25 pale-gold-theme corner bottom-right">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#common_set_corner" />
					</svg>
				</i>
			</div>
			<div class="frame complete-premium" *ngIf="isPremiumComplete()">
				<div class="outer-border"></div>

				<i class="i-22X30 gold-theme corner bottom-left">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
					</svg>
				</i>

				<i class="i-22X30 gold-theme corner top-left">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
					</svg>
				</i>

				<i class="i-22X30 gold-theme corner top-right">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
					</svg>
				</i>

				<i class="i-22X30 gold-theme corner bottom-right">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#two_gold_leaves" />
					</svg>
				</i>

				<div class="crown">
					<i class="i-20X10 gold-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#three_gold_leaves" />
						</svg>
					</i>
				</div>
			</div>
			<div class="coming-soon-info" *ngIf="!released">
				<i>
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#coming_soon" />
					</svg>
				</i>
				<p [fsTranslate]="'app.collection.sets.coming-soon'"></p>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetViewComponent {
	@Output() setClicked = new EventEmitter<string>();

	@Input() released: boolean;
	@Input() showHoverEffect = true;
	@Input() collectedCards: number;
	@Input() collectableCards: number;
	@Input() collectedCardsGolden: number;
	@Input() set setId(value: string) {
		this._setId = value;
		this.logoUrl = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/sets/${value}.png`;
		this.setName = `global.set.${value}`;
		if (['classic', 'core', 'legacy', 'demon_hunter_initiate', 'caverns_of_time'].includes(value)) {
			this._displayName = true;
		}
	}

	logoUrl: string;
	_displayName = false;
	setName: string;
	_setId: string;

	isSimpleComplete() {
		if (!this.released) {
			return false;
		}
		return this.collectedCards === this.collectableCards;
	}

	isPremiumComplete() {
		if (!this.released) {
			return false;
		}
		return this.collectedCardsGolden === this.collectableCards;
	}

	browseSet() {
		if (!this.released) {
			return;
		}
		this.setClicked.next(this._setId);
	}
}
