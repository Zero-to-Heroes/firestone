/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CardType, isBaconGhost } from '@firestone-hs/reference-data';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { BgsSimulatorControllerService, Side } from '../services/sim-ui-controller/bgs-simulator-controller.service';

@Component({
	selector: 'bgs-hero-portrait-simulator',
	styleUrls: [`./bgs-hero-portrait-simulator.component.scss`],
	template: `
		<div class="container">
			<div class="quest-reward" *ngIf="useQuests">
				<div class="item-container" [cardTooltip]="_questRewardCardId" [cardTooltipPosition]="tooltipPosition">
					<img [src]="questRewardIcon" class="image" *ngIf="!!questRewardIcon" />
					<div class="image empty-icon" *ngIf="!questRewardIcon"></div>
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_quest_reward_frame.png"
						class="frame"
					/>
				</div>
				<bgs-plus-button
					class="change-icon"
					(click)="onQuestRewardClick()"
					[useUpdateIcon]="!defaultHero"
				></bgs-plus-button>
			</div>
			<div class="trinkets" *ngIf="useTrinkets">
				<div class="trinket greater">
					<div
						class="item-container"
						[cardTooltip]="_greaterTrinketCardId"
						[cardTooltipPosition]="tooltipPosition"
						[cardTooltipBgs]="true"
					>
						<img [src]="greaterTrinketIcon" class="image" *ngIf="!!greaterTrinketIcon" />
						<div class="image empty-icon" *ngIf="!greaterTrinketIcon"></div>
						<img
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/simulator/trinket_frame.png"
							class="frame"
						/>
					</div>
					<bgs-plus-button
						class="change-icon"
						(click)="onGreaterTrinketClick()"
						[useUpdateIcon]="!!greaterTrinketIcon"
					></bgs-plus-button>
				</div>
				<div class="trinket lesser">
					<div
						class="item-container"
						[cardTooltip]="_lesserTrinketCardId"
						[cardTooltipPosition]="tooltipPosition"
						[cardTooltipBgs]="true"
					>
						<img [src]="lesserTrinketIcon" class="image" *ngIf="!!lesserTrinketIcon" />
						<div class="image empty-icon" *ngIf="!lesserTrinketIcon"></div>
						<img
							src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/simulator/trinket_frame.png"
							class="frame"
						/>
					</div>
					<bgs-plus-button
						class="change-icon"
						(click)="onLesserTrinketClick()"
						[useUpdateIcon]="!!lesserTrinketIcon"
					></bgs-plus-button>
				</div>
			</div>
			<div class="hero">
				<bgs-hero-portrait
					class="portrait click-to-change"
					[heroCardId]="_heroCardId"
					[health]="health"
					[maxHealth]="maxHealth"
				></bgs-hero-portrait>
				<bgs-plus-button
					class="change-icon"
					(click)="onPortraitClick()"
					[useUpdateIcon]="!defaultHero"
				></bgs-plus-button>
				<tavern-level-icon *ngIf="_tavernTier" [level]="_tavernTier" class="tavern"></tavern-level-icon>
			</div>
			<div class="hero-power">
				<!-- TODO: support for multiple hero powers -->
				<div
					class="item-container"
					[cardTooltip]="_heroPowerCardId"
					[cardTooltipPosition]="tooltipPosition"
					[cardTooltipBgs]="isHeroPowerBgs"
				>
					<img [src]="heroPowerIcon" class="image" *ngIf="!!heroPowerIcon" />
					<div class="image empty-icon" *ngIf="!heroPowerIcon"></div>
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs_hero_power_frame.png"
						class="frame"
					/>
				</div>
				<bgs-plus-button
					class="change-icon"
					(click)="onHeroPowerClick()"
					[useUpdateIcon]="!defaultHero"
				></bgs-plus-button>
			</div>
			<div
				class="global-info"
				(click)="onHeroGlobalInfoClick()"
				[helpTooltip]="'battlegrounds.sim.global-info-title-tooltip' | fsTranslate"
			>
				<div class="item-container">
					<img
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/simulator/hero_enchantments.png"
						class="icon"
					/>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroPortraitSimulatorComponent {
	useQuests = false;
	useTrinkets = true;

	@Input() health = 40;
	@Input() maxHealth = 40;
	@Input() tooltipPosition: CardTooltipPositionType;
	@Input() side: Side;

	@Input() set heroCardId(value: string) {
		this._heroCardId = value;
		this.defaultHero = isBaconGhost(value);
	}

	@Input() set tavernTier(value: number | null) {
		this._tavernTier = value;
	}

	@Input() set heroPowerCardId(value: string | null | undefined) {
		this._heroPowerCardId = value;
		this.heroPowerIcon = !!value ? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg` : null;
		this.isHeroPowerBgs = !value
			? false
			: this.allCards.getCard(value).type?.toUpperCase() === CardType[CardType.BATTLEGROUND_TRINKET];
	}

	@Input() set questRewardCardId(value: string | null | undefined) {
		this._questRewardCardId = value;
		this.questRewardIcon = !!value ? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg` : null;
	}

	@Input() set greaterTrinketCardId(value: string | null | undefined) {
		this._greaterTrinketCardId = value;
		this.greaterTrinketIcon = !!value
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg`
			: null;
	}

	@Input() set lesserTrinketCardId(value: string | null | undefined) {
		this._lesserTrinketCardId = value;
		this.lesserTrinketIcon = !!value
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg`
			: null;
	}

	heroPowerIcon: string | null;
	questRewardIcon: string | null;
	greaterTrinketIcon: string | null;
	lesserTrinketIcon: string | null;
	_heroCardId: string;
	_heroPowerCardId: string | null | undefined;
	isHeroPowerBgs: boolean;
	_questRewardCardId: string | null | undefined;
	_greaterTrinketCardId: string | null | undefined;
	_lesserTrinketCardId: string | null | undefined;
	_tavernTier: number | null;
	defaultHero = true;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly controller: BgsSimulatorControllerService,
		private readonly allCards: CardsFacadeService,
	) {}

	onPortraitClick() {
		this.controller.requestHeroChange(this.side);
	}

	onHeroPowerClick() {
		this.controller.requestHeroPowerChange(this.side);
	}

	onHeroGlobalInfoClick() {
		this.controller.requestGlobalInfoChange(this.side);
	}

	onQuestRewardClick() {
		this.controller.requestQuestRewardChange(this.side);
	}

	onGreaterTrinketClick() {
		this.controller.requestGreaterTrinketChange(this.side);
	}

	onLesserTrinketClick() {
		this.controller.requestLesserTrinketChange(this.side);
	}
}
