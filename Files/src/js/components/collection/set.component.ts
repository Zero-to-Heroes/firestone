import { Component, HostListener, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

import { Card } from '../../models/card';
import { Set, SetCard } from '../../models/set';
import { Events } from '../../services/events.service';

declare var overwolf: any;

@Component({
	selector: 'set-view',
	styleUrls: [`../../../css/component/collection/set.component.scss`],
	template: `
		<div *ngIf="_cardSet" class="set">
			<div [hidden]="showingExtraInfo" class="set-view" (click)="browseSet()">
				<div class="logo-container">
					<img src="{{'/Files/assets/images/sets/' + _cardSet.id + '.png'}}" class="set-logo" />
					<span class="text set-name" *ngIf="_displayName">{{_cardSet.name}}</span>
				</div>
				<span class="cards-collected">{{_cardSet.ownedLimitCollectibleCards}}/{{_cardSet.numberOfLimitCollectibleCards()}}</span>
				<div class="frame complete-simple" *ngIf="isSimpleComplete() && !isPremiumComplete()">
					<i class="i-25 pale-gold-theme corner bottom-left">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner"/>
						</svg>
					</i>
					<i class="i-25 pale-gold-theme corner top-left">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner"/>
						</svg>
					</i>
					<i class="i-25 pale-gold-theme corner top-right">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner"/>
						</svg>
					</i>
					<i class="i-25 pale-gold-theme corner bottom-right">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#common_set_corner"/>
						</svg>
					</i>
				</div>
				<div class="frame complete-premium" *ngIf="isPremiumComplete()">
					<div class="outer-border"></div>

					<i class="i-22X30 gold-theme corner bottom-left">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
						</svg>
					</i>

					<i class="i-22X30 gold-theme corner top-left">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
						</svg>
					</i>

					<i class="i-22X30 gold-theme corner top-right">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
						</svg>
					</i>

					<i class="i-22X30 gold-theme corner bottom-right">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#two_gold_leaves"/>
						</svg>
					</i>

					<div class="crown">
						<i class="i-20X10 gold-theme">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#three_gold_leaves"/>
							</svg>
						</i>
					</div>
				</div>
			</div>
			<div [hidden]="!showingExtraInfo" class="extra-info">
				<div class="title">
					<i class="i-15 pale-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="/Files/assets/svg/sprite.svg#timer"/>
						</svg>
					</i>
					<span>Next guaranteed:</span>
				</div>
				<div class="progression epic">
					<div class="progress-title">
						<img src="/Files/assets/images/rarity/rarity-epic-small.png" />
						<span>In {{epicTimer}} packs</span>
					</div>
					<div class="progress-bar">
						<div class="progress-bar-filled" [style.width.%]="epicFill">
						</div>
					</div>
				</div>
				<div class="progression legendary">
					<div class="progress-title">
						<img src="/Files/assets/images/rarity/rarity-legendary-small.png" />
						<span>In {{legendaryTimer}} packs</span>
					</div>
					<div class="progress-bar">
						<div class="progress-bar-filled" [style.width.%]="legendaryFill">
						</div>	
					</div>
					<button class="browse-set-button" (click)="browseSet()">Browse Set</button>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
// 7.1.1.17994
export class SetComponent {

	_cardSet: Set;
	_displayName = false;
	epicTimer: number = 10;
	epicFill: number = 0;
	legendaryTimer: number = 40;
	legendaryFill: number = 0;
	showingExtraInfo = false;

	constructor(private cdr: ChangeDetectorRef, private events: Events) {

	}

	@Input('cardSet') set cardSet(set: Set) {
		this._cardSet = set;
		console.log('setting set', set, set.name)
		if (['Basic', 'Classic', 'Hall of Fame'].indexOf(set.name) > -1) {
			this._displayName = true;
		}
		this.epicTimer = set.pityTimer.packsUntilGuaranteedEpic;
		this.epicFill = (10 - this.epicTimer) / 10 * 100;
		this.legendaryTimer = set.pityTimer.packsUntilGuaranteedLegendary;
		this.legendaryFill = (40 - this.legendaryTimer) / 40 * 100;
	}

	isSimpleComplete() {
		return this._cardSet.ownedLimitCollectibleCards == this._cardSet.numberOfLimitCollectibleCards()
	}

	isPremiumComplete() {
		return this._cardSet.ownedLimitCollectiblePremiumCards == this._cardSet.numberOfLimitCollectibleCards()
	}

	browseSet() {
		this.events.broadcast(Events.SET_SELECTED, this._cardSet);
	}

	@HostListener('mouseenter') onMouseEnter() {
		this.showingExtraInfo = true;
		this.cdr.detectChanges();
	}

	@HostListener('mouseleave')
	onMouseLeave() {
		this.showingExtraInfo = false;
		this.cdr.detectChanges();
	}
}
