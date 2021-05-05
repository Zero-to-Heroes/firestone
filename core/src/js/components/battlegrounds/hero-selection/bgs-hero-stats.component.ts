import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { PatchInfo } from '../../../models/patches';

@Component({
	selector: 'bgs-hero-stats',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-stats.component.scss`,
	],
	template: `
		<div class="stats">
			<div class="title">Stats</div>
			<div class="entry">
				<div class="label" helpTooltip="Average final position">Avg position:</div>
				<div
					class="global-value"
					[helpTooltip]="
						'Value for the top 10% of players since patch ' + patchNumber?.number + ' (6000+ MMR)'
					"
				>
					{{ buildValue(_hero?.averagePosition) }}
				</div>
				<div
					class="player-value"
					[helpTooltip]="'Your value, based on all your games since patch ' + patchNumber?.number"
				>
					({{ buildValue(_hero?.playerAveragePosition) }})
				</div>
			</div>
			<div class="entry">
				<div class="label" helpTooltip="Percentage of times ending in top 4">Top 4:</div>
				<div
					class="global-value"
					[helpTooltip]="
						'Value for the top 10% of players since patch ' + patchNumber?.number + ' (6000+ MMR)'
					"
				>
					{{ buildPercents(_hero?.top4) }}
				</div>
				<div
					class="player-value"
					[helpTooltip]="'Your value, based on all your games since patch ' + patchNumber?.number"
				>
					({{ buildPercents(_hero?.playerTop4) }})
				</div>
			</div>
			<div class="entry">
				<div class="label" helpTooltip="Percentage of times winning the run">Top 1:</div>
				<div
					class="global-value"
					[helpTooltip]="
						'Value for the top 10% of players since patch ' + patchNumber?.number + ' (6000+ MMR)'
					"
				>
					{{ buildPercents(_hero?.top1) }}
				</div>
				<div
					class="player-value"
					[helpTooltip]="'Your value, based on all your games since patch ' + patchNumber?.number"
				>
					({{ buildPercents(_hero?.playerTop1) }})
				</div>
			</div>
			<div class="entry">
				<div class="label" helpTooltip="Percentage of times this hero is played">Popularity:</div>
				<div
					class="global-value"
					[helpTooltip]="
						'Value for the top 10% of players since patch ' + patchNumber?.number + ' (6000+ MMR)'
					"
				>
					{{ buildPercents(_hero?.popularity) }}
				</div>
				<div
					class="player-value"
					[helpTooltip]="'Your value, based on all your games since patch ' + patchNumber?.number"
				>
					({{ buildPercents(_hero?.playerPopularity) }})
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroStatsComponent {
	_hero: BgsHeroStat;
	@Input() patchNumber: PatchInfo;

	@Input() set hero(value: BgsHeroStat) {
		this._hero = value;
		// console.log('setting hero', value);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
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

	buildPercents(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(2);
	}
}
