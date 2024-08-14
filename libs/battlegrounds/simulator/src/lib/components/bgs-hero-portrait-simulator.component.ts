import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { isBaconGhost } from '@firestone-hs/reference-data';
import { CardTooltipPositionType } from '@firestone/shared/common/view';
import { BgsSimulatorControllerService, Side } from '../services/sim-ui-controller/bgs-simulator-controller.service';

@Component({
	selector: 'bgs-hero-portrait-simulator',
	styleUrls: [`./bgs-hero-portrait-simulator.component.scss`],
	template: `
		<div class="container">
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
			<div class="quest-reward">
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
			<div class="hero-power">
				<div class="item-container" [cardTooltip]="_heroPowerCardId" [cardTooltipPosition]="tooltipPosition">
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
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroPortraitSimulatorComponent {
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
	}

	@Input() set questRewardCardId(value: string | null | undefined) {
		this._questRewardCardId = value;
		this.questRewardIcon = !!value ? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg` : null;
	}

	heroPowerIcon: string | null;
	questRewardIcon: string | null;
	_heroCardId: string;
	_heroPowerCardId: string | null | undefined;
	_questRewardCardId: string | null | undefined;
	_tavernTier: number | null;
	defaultHero = true;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly controller: BgsSimulatorControllerService) {}

	onPortraitClick() {
		this.controller.requestHeroChange(this.side);
	}

	onHeroPowerClick() {
		this.controller.requestHeroPowerChange(this.side);
	}

	onQuestRewardClick() {
		this.controller.requestQuestRewardChange(this.side);
	}
}
