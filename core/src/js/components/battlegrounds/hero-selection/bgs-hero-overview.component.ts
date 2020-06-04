import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroOverview } from '../../../models/battlegrounds/hero-selection/bgs-hero-overview';
import { BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-overview',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
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
			<div class="profile" *ngIf="warbandStats">
				<div
					class="title"
					[helpTooltip]="
						'Board stats per turn, compared to the average board stats between all heroes (top4 6000+ MMR) since patch ' +
						patchNumber
					"
				>
					Warband stats
				</div>
				<bgs-hero-warband-stats [warbandStats]="warbandStats"></bgs-hero-warband-stats>
			</div>
			<bgs-hero-tribes [hero]="_hero"></bgs-hero-tribes>
		</div>
		<div class="hero-overview empty" *ngIf="!_hero">
			<i class="placeholder">
				<svg class="svg-icon-fill">
					<use xlink:href="/Files/assets/svg/sprite.svg#ad_placeholder" />
				</svg>
			</i>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroOverviewComponent {
	_hero: BgsHeroOverview;
	icon: string;
	tier: BgsHeroTier;
	tribes: readonly { tribe: string; percent: string }[];
	warbandStats: readonly { turn: number; totalStats: number }[];
	@Input() patchNumber: number;

	@Input() set hero(value: BgsHeroOverview) {
		// console.log('setting hero', value, this._hero);
		this._hero = value;
		if (!value) {
			return;
		}
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.heroCardId}.png`;
		this.tribes = [...value.tribesStat]
			.sort((a, b) => b.percent - a.percent)
			.map(stat => ({ tribe: this.getTribe(stat.tribe), percent: stat.percent.toFixed(1) }))
			.slice(0, 5);
		this.warbandStats = value.warbandStats;
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
