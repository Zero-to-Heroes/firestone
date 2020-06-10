import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsHeroOverview } from '../../../models/battlegrounds/hero-selection/bgs-hero-overview';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-stats',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-stats.component.scss`,
	],
	template: `
		<div class="stats">
			<div class="title">Stats</div>
			<div class="entry">
				<div class="label" helpTooltip="Average final position">
					Avg position:
				</div>
				<div
					class="global-value"
					[helpTooltip]="'Value for the top 10% of players since patch ' + patchNumber + ' (6000+ MMR)'"
				>
					{{ buildValue(_hero?.globalAveragePosition) }}
				</div>
				<div
					class="player-value"
					[helpTooltip]="'Your value, based on all your games since patch ' + patchNumber"
				>
					({{ buildValue(_hero?.ownAveragePosition) }})
				</div>
			</div>
			<div class="entry">
				<div class="label" helpTooltip="Percentage of times ending in top 4">
					Top 4:
				</div>
				<div
					class="global-value"
					[helpTooltip]="'Value for the top 10% of players since patch ' + patchNumber + ' (6000+ MMR)'"
				>
					{{ buildPercents(_hero?.globalTop4) }}
				</div>
				<div
					class="player-value"
					[helpTooltip]="'Your value, based on all your games since patch ' + patchNumber"
				>
					({{ buildPercents(_hero?.ownTop4Percentage) }})
				</div>
			</div>
			<div class="entry">
				<div class="label" helpTooltip="Percentage of times winning the run">
					Top 1:
				</div>
				<div
					class="global-value"
					[helpTooltip]="'Value for the top 10% of players since patch ' + patchNumber + ' (6000+ MMR)'"
				>
					{{ buildPercents(_hero?.globalTop1) }}
				</div>
				<div
					class="player-value"
					[helpTooltip]="'Your value, based on all your games since patch ' + patchNumber"
				>
					({{ buildPercents(_hero?.ownTop1Percentage) }})
				</div>
			</div>
			<div class="entry">
				<div class="label" helpTooltip="Percentage of times this hero is plqyed">
					Popularity:
				</div>
				<div
					class="global-value"
					[helpTooltip]="'Value for the top 10% of players since patch ' + patchNumber + ' (6000+ MMR)'"
				>
					{{ buildPercents(_hero?.globalPopularity) }}
				</div>
				<div
					class="player-value"
					[helpTooltip]="'Your value, based on all your games since patch ' + patchNumber"
				>
					({{ buildPercents(_hero?.ownPopularity) }})
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroStatsComponent {
	_hero: BgsHeroOverview;
	@Input() patchNumber: number;

	@Input() set hero(value: BgsHeroOverview) {
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
		return value == null ? 'N/A' : value.toFixed(1) + '%';
	}

	buildValue(value: number): string {
		return value == null ? 'N/A' : value.toFixed(2);
	}
}
