import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { CardTooltipPositionType } from '../../../directives/card-tooltip-position.type';

@Component({
	selector: 'bgs-hero-portrait-simulator',
	styleUrls: [`../../../../css/component/battlegrounds/battles/bgs-hero-portrait-simulator.component.scss`],
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
			<div class="quest-reward" *ngIf="fullScreenMode || _questRewardCardId">
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
	@Output() portraitChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() heroPowerChangeRequested: EventEmitter<void> = new EventEmitter<void>();
	@Output() questRewardChangeRequested: EventEmitter<void> = new EventEmitter<void>();

	@Input() health = 40;
	@Input() maxHealth = 40;
	@Input() tooltipPosition: CardTooltipPositionType;
	@Input() fullScreenMode: boolean;

	@Input() set heroCardId(value: string) {
		this._heroCardId = value;
		this.defaultHero = value === CardIds.KelthuzadBattlegrounds;
	}

	@Input() set tavernTier(value: number) {
		this._tavernTier = value;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set heroPowerCardId(value: string) {
		this._heroPowerCardId = value;
		this.heroPowerIcon = !!value ? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg` : null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set questRewardCardId(value: string) {
		this._questRewardCardId = value;
		this.questRewardIcon = !!value ? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value}.jpg` : null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	heroPowerIcon: string;
	questRewardIcon: string;
	_heroCardId: string;
	_heroPowerCardId: string;
	_questRewardCardId: string;
	_tavernTier: number;
	defaultHero = true;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	onPortraitClick() {
		this.portraitChangeRequested.next();
	}

	onHeroPowerClick() {
		this.heroPowerChangeRequested.next();
	}

	onQuestRewardClick() {
		this.questRewardChangeRequested.next();
	}
}
