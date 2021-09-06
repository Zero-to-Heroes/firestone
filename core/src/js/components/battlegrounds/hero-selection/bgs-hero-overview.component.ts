import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsHeroStat, BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../../models/battlegrounds/stats/bgs-stats';
import { PatchInfo } from '../../../models/patches';
import { VisualAchievement } from '../../../models/visual-achievement';
import { defaultStartingHp } from '../../../services/hs-utils';

@Component({
	selector: 'bgs-hero-overview',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-overview.component.scss`,
	],
	template: `
		<div class="hero-overview" *ngIf="_hero">
			<div class="name">{{ _hero.name }}</div>
			<div class="tier {{ tier?.toLowerCase() }}">{{ tier }}</div>
			<div class="portrait-container">
				<bgs-hero-portrait
					class="portrait"
					[heroCardId]="_hero.id"
					[health]="health"
					[maxHealth]="health"
					[cardTooltip]="_hero.heroPowerCardId"
					[cardTooltipClass]="'bgs-hero-select'"
				></bgs-hero-portrait>
				<div class="achievements" *ngIf="achievementsToDisplay?.length">
					<div
						class="achievement"
						*ngFor="let achievement of achievementsToDisplay; let i = index; trackBy: trackByFn"
						[ngClass]="{ 'completed': achievement.completed }"
					>
						<div
							class="icon"
							inlineSVG="assets/svg/achievements/categories/hearthstone_game.svg"
							[helpTooltip]="achievement.text"
						></div>
					</div>
				</div>
			</div>
			<bgs-hero-stats [hero]="_hero" [patchNumber]="patchNumber"></bgs-hero-stats>
			<div class="winrate">
				<div
					class="title"
					[helpTooltip]="
						'Battle winrate per turn (it gives you an indication of when this hero is the strongest)'
					"
				>
					Winrate per turn
				</div>
				<bgs-winrate-chart [globalStats]="globalStats" [player]="player"></bgs-winrate-chart>
			</div>
			<bgs-hero-tribes class="tribes-overview" [hero]="_hero"></bgs-hero-tribes>
		</div>
		<div class="hero-overview empty" *ngIf="!_hero && !hideEmptyState">
			<i class="placeholder">
				<svg class="svg-icon-fill">
					<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroOverviewComponent {
	@Input() patchNumber: PatchInfo;
	@Input() globalStats: BgsStats;
	@Input() hideEmptyState: boolean;

	_hero: BgsHeroStat;
	player: BgsPlayer;
	health: number;
	tier: BgsHeroTier;
	tribes: readonly { tribe: string; percent: string }[];
	achievementsToDisplay: readonly InternalAchievement[];

	@Input() set hero(value: BgsHeroStat) {
		this._hero = value;
		if (!value) {
			return;
		}

		this.health = defaultStartingHp(GameType.GT_BATTLEGROUNDS, value.baseCardId);
		this.player = BgsPlayer.create({
			cardId: value.baseCardId,
		} as BgsPlayer);
		this.tribes = [...value.tribesStat]
			.sort((a, b) => b.percent - a.percent)
			.map((stat) => ({ tribe: this.getTribe(stat.tribe), percent: stat.percent.toFixed(1) }))
			.slice(0, 5);
		this.tier = value.tier;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@Input() set achievements(value: readonly VisualAchievement[]) {
		this.achievementsToDisplay = [];
		if (!value) {
			return;
		}

		setTimeout(() => {
			this.achievementsToDisplay = value
				.map((ach) => ach.completionSteps)
				.reduce((a, b) => a.concat(b), [])
				.filter((step) => step)
				.map((step) => ({
					completed: !!step.numberOfCompletions,
					text: `Achievement ${!!step.numberOfCompletions ? 'completed' : 'missing'}: ${step.completedText}`,
				}))
				.sort((a, b) => {
					if (a.completed) {
						return 1;
					}
					if (b.completed) {
						return -1;
					}
					return 0;
				})
				.slice(0, 4);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
			//console.debug('setting achievements in tilmeout', this.achievementsToDisplay, value);
		});
		//console.debug('setting achievements', this.achievementsToDisplay, value);
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	getIcon(tribe: string): string {
		let referenceCardId: string;
		switch (tribe) {
			case 'Mech':
				referenceCardId = 'GVG_027';
				break;
			case 'Beast':
				referenceCardId = 'BGS_021';
				break;
			case 'Demon':
				referenceCardId = 'TB_BaconUps_060';
				break;
			case 'Dragon':
				referenceCardId = 'BGS_036';
				break;
			case 'Murloc':
				referenceCardId = 'BGS_030';
				break;
			case 'Pirate':
				referenceCardId = 'BGS_080';
				break;
			default:
				referenceCardId = 'BGS_009';
				break;
		}
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${referenceCardId}.jpg`;
	}

	trackByFn(index, item: InternalAchievement) {
		return index;
	}

	private getTribe(tribe: string): string {
		if (tribe === 'mechanical') {
			tribe = 'mech';
		} else if (tribe === 'blank') {
			tribe = 'no tribe';
		}
		return tribe.charAt(0).toUpperCase() + tribe.slice(1);
	}
}

interface InternalAchievement {
	readonly completed: boolean;
	readonly text: string;
}
