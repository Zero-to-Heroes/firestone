import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { BgsHeroOverview } from '../../../models/battlegrounds/hero-selection/bgs-hero-overview';
import { BgsHeroTier } from '../../../models/battlegrounds/stats/bgs-hero-stat';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-overview',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-overview.component.scss`,
	],
	template: `
		<div class="hero-overview">
			<div class="name">{{ _hero.name }}</div>
			<div class="tier {{ tier?.toLowerCase() }}">{{ tier }}</div>
			<img [src]="icon" class="portrait" />
			<div class="stats">
				<div class="title">Stats</div>
				<div class="entry">
					<div class="label" helpTooltip="Average final position">
						Avg position
					</div>
					<div
						class="global-value"
						helpTooltip="Value for the top 10% of players since the last patch (6000+ MMR)"
					>
						{{ _hero.globalAveragePosition.toFixed(1) }}
					</div>
					<div class="player-value" helpTooltip="Your value, based on all your games since the last patch">
						({{ _hero.ownAveragePosition.toFixed(1) }})
					</div>
				</div>
				<div class="entry">
					<div class="label" helpTooltip="Percentage of times ending in top 4">
						Top 4
					</div>
					<div
						class="global-value"
						helpTooltip="Value for the top 10% of players since the last patch (6000+ MMR)"
					>
						{{ _hero.globalTop4.toFixed(0) }}%
					</div>
					<div class="player-value" helpTooltip="Your value, based on all your games since the last patch">
						({{ _hero.ownTop4Percentage.toFixed(0) }}%)
					</div>
				</div>
				<div class="entry">
					<div class="label" helpTooltip="Percentage of times winning the run">
						Top 1
					</div>
					<div
						class="global-value"
						helpTooltip="Value for the top 10% of players since the last patch (6000+ MMR)"
					>
						{{ _hero.globalTop1.toFixed(0) }}%
					</div>
					<div class="player-value" helpTooltip="Your value, based on all your games since the last patch">
						({{ _hero.ownTop1Percentage.toFixed(0) }}%)
					</div>
				</div>
				<div class="entry">
					<div class="label" helpTooltip="Percentage of times this hero is plqyed">
						Popularity
					</div>
					<div
						class="global-value"
						helpTooltip="Value for the top 10% of players since the last patch (6000+ MMR)"
					>
						{{ _hero.globalPopularity.toFixed(0) }}%
					</div>
					<div class="player-value" helpTooltip="Your value, based on all the games since the last patch">
						({{ _hero.ownPopularity.toFixed(0) }}%)
					</div>
				</div>
			</div>
			<div class="profile">
				<div
					class="title"
					helpTooltip="Board stats per turn, compared to the average board stats between all heroes"
				>
					Warband stats
				</div>
				<bgs-hero-warband-stats [warbandStats]="warbandStats"></bgs-hero-warband-stats>
			</div>
			<div class="tribes">
				<div class="title" helpTooltip="Percentage of each tribe present in average in winning warbands">
					Winning tribes
				</div>
				<div class="composition">
					<div *ngFor="let tribe of tribes" class="tribe">
						<div class="icon-container">
							<img class="icon" [src]="getIcon(tribe.tribe)" [helpTooltip]="tribe.tribe" />
						</div>
						<div class="value">{{ tribe.percent }}%</div>
					</div>
				</div>
			</div>
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

	@Input() set hero(value: BgsHeroOverview) {
		this._hero = value;
		console.log('setting hero', value);
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.heroCardId}.png`;
		this.tribes = [...value.tribesStat]
			.sort((a, b) => b.percent - a.percent)
			.map(stat => ({ tribe: stat.tribe, percent: stat.percent.toFixed(1) }))
			.slice(0, 5);
		this.warbandStats = value.warbandStats;
		this.tier = value.tier;
	}

	getIcon(tribe: string): string {
		let referenceCardId: string;
		switch (tribe) {
			case 'mech':
			case 'mechanical':
				referenceCardId = 'BOT_537';
				break;
			case 'beast':
				referenceCardId = 'BGS_021';
				break;
			case 'demon':
				referenceCardId = 'TB_BaconUps_060';
				break;
			case 'dragon':
				referenceCardId = 'BGS_036';
				break;
			case 'murloc':
				referenceCardId = 'BGS_030';
				break;
			default:
				referenceCardId = 'BGS_009';
				break;
		}
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${referenceCardId}.jpg`;
	}
}
