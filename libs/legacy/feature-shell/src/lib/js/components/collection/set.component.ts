import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { Set } from '../../models/set';
import { SelectCollectionSetEvent } from '../../services/mainwindow/store/events/collection/select-collection-set-event';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'set-view',
	styleUrls: [`../../../css/component/collection/set.component.scss`],
	template: `
		<div *ngIf="_cardSet" class="set" [ngClass]="{ 'coming-soon': !released }" (click)="browseSet()">
			<div class="logo-container">
				<img [src]="logoUrl" class="set-logo" />
				<span class="text set-name" *ngIf="_displayName" [owTranslate]="setName"></span>
			</div>
			<span
				class="cards-collected"
				*ngIf="released"
				[helpTooltip]="'app.collection.sets.total-non-golden-cards' | owTranslate"
			>
				{{ _cardSet.ownedLimitCollectibleCards }}/{{ _cardSet.numberOfLimitCollectibleCards() }}
			</span>
			<span
				class="cards-collected premium"
				*ngIf="released"
				[helpTooltip]="'app.collection.sets.total-golden-cards' | owTranslate"
			>
				{{ getOwnedLimitCollectibleCards() }}/{{ _cardSet.numberOfLimitCollectibleCards() }}
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
				<p [owTranslate]="'app.collection.sets.coming-soon'"></p>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SetComponent implements AfterViewInit {
	private readonly MOUSE_OVER_DELAY = 300;

	@Input() set cardSet(set: Set) {
		this._cardSet = set;
		this.logoUrl = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/sets/${set.id}.png`;
		this.setName = `global.set.${set.id}`;
		this.released = set.allCards && set.allCards.length > 0;
		if (['classic', 'core', 'legacy', 'demon_hunter_initiate'].includes(set.id)) {
			this._displayName = true;
		}
	}

	_cardSet: Set;
	logoUrl: string;
	_displayName = false;
	released = true;
	setName: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private ow: OverwolfService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	isSimpleComplete() {
		if (!this.released) {
			return false;
		}
		return this._cardSet.ownedLimitCollectibleCards === this._cardSet.numberOfLimitCollectibleCards();
	}

	isPremiumComplete() {
		if (!this.released) {
			return false;
		}
		return this._cardSet.ownedLimitCollectiblePremiumCards === this._cardSet.numberOfLimitCollectibleCards();
	}

	getOwnedLimitCollectibleCards(): number {
		return this._cardSet.allCards.map((card) => card.getNumberCollectedPremium()).reduce((c1, c2) => c1 + c2, 0);
	}

	browseSet() {
		if (!this.released) {
			return;
		}
		this.stateUpdater.next(new SelectCollectionSetEvent(this._cardSet.id));
	}
}
