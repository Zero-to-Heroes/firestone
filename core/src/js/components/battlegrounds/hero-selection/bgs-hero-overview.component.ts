import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsPlayer } from '../../../models/battlegrounds/bgs-player';
import { BgsHeroStat, BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { BgsStats } from '../../../models/battlegrounds/stats/bgs-stats';
import { PatchInfo } from '../../../models/patches';

declare let amplitude: any;

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
			<img
				[src]="icon"
				class="portrait"
				[cardTooltip]="_hero.heroPowerCardId"
				[cardTooltipClass]="'bgs-hero-select'"
			/>
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
		<div class="hero-overview empty" *ngIf="!_hero">
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

	_hero: BgsHeroStat;
	player: BgsPlayer;
	icon: string;
	tier: BgsHeroTier;
	tribes: readonly { tribe: string; percent: string }[];
	// warbandStats: readonly { turn: number; totalStats: number }[];

	@Input() set hero(value: BgsHeroStat) {
		// console.log('setting hero', value, this._hero);
		this._hero = value;
		if (!value) {
			return;
		}
		this.player = BgsPlayer.create({
			cardId: value.id,
		} as BgsPlayer);
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.id}.png?v=3`;
		this.tribes = [...value.tribesStat]
			.sort((a, b) => b.percent - a.percent)
			.map(stat => ({ tribe: this.getTribe(stat.tribe), percent: stat.percent.toFixed(1) }))
			.slice(0, 5);
		// this.warbandStats = value.warbandStats;
		this.tier = value.tier;
	}

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

	private getTribe(tribe: string): string {
		if (tribe === 'mechanical') {
			tribe = 'mech';
		} else if (tribe === 'blank') {
			tribe = 'no tribe';
		}
		return tribe.charAt(0).toUpperCase() + tribe.slice(1);
	}
}
