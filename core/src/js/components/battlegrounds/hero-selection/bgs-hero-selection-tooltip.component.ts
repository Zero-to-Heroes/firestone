import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroOverview } from '../../../models/battlegrounds/hero-selection/bgs-hero-overview';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-selection-tooltip',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-tooltip.component.scss`,
	],
	template: `
		<div class="hero-selection-tooltip">
			<img class="hero-power" [src]="heroPowerImage" />
			<!-- <bgs-hero-warband-stats class="warband-stats" [warbandStats]="warbandStats"></bgs-hero-warband-stats> -->
			<div class="infos">
				<bgs-hero-stats [hero]="_hero"></bgs-hero-stats>
				<div class="tribes">
					<div class="title" helpTooltip="Percentage of each tribe present in average in winning warbands">
						Winning tribes
					</div>
					<div class="composition">
						<div *ngFor="let tribe of tribes" class="tribe">
							<div class="icon-container">
								<img class="icon" [src]="getIcon(tribe.tribe)" [helpTooltip]="tribe.tribe" />
							</div>
							<div class="tribe-name">{{ tribe.tribe }}</div>
							<div class="value">{{ tribe.percent }}%</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroSelectionTooltipComponent {
	_hero: BgsHeroOverview;
	heroPowerImage: string;
	tribes: readonly { tribe: string; percent: string }[];
	warbandStats: readonly { turn: number; totalStats: number }[];

	@Input() set config(value: BgsHeroOverview) {
		this._hero = value;
		this.heroPowerImage = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/${value.heroPowerCardId}.png`;
		this.tribes = [...value.tribesStat]
			.sort((a, b) => b.percent - a.percent)
			.map(stat => ({ tribe: this.getTribe(stat.tribe), percent: stat.percent.toFixed(1) }))
			.slice(0, 5);
		this.warbandStats = value.warbandStats;
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
