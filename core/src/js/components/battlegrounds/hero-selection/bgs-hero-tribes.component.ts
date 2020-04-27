import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsHeroOverview } from '../../../models/battlegrounds/hero-selection/bgs-hero-overview';

declare let amplitude: any;

@Component({
	selector: 'bgs-hero-tribes',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-tribes.component.scss`,
	],
	template: `
		<div class="tribes">
			<div class="title" helpTooltip="Percentage of each tribe present in average in winning warbands">
				Winning tribes
			</div>
			<div class="composition">
				<div *ngFor="let tribe of tribes || []; trackBy: trackByTribeFn" class="tribe">
					<div class="icon-container">
						<img class="icon" [src]="getIcon(tribe.tribe)" [helpTooltip]="tribe.tribe" />
					</div>
					<div class="tribe-name">{{ tribe.tribe }}</div>
					<div class="value">{{ tribe.percent }}%</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsHeroTribesComponent {
	_hero: BgsHeroOverview;
	tribes: readonly { tribe: string; percent: string }[];

	@Input() set hero(value: BgsHeroOverview) {
		this._hero = value;
		this.tribes = [];
		setTimeout(() => {
			this.tribes = [...value.tribesStat]
				.sort((a, b) => b.percent - a.percent)
				.map(stat => ({ tribe: this.getTribe(stat.tribe), percent: stat.percent.toFixed(1) }))
				.slice(0, 5);
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		});
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
			default:
				referenceCardId = 'BGS_009';
				break;
		}
		return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${referenceCardId}.jpg`;
	}

	trackByTribeFn(index, item: { tribe: string; percent: string }) {
		return item.tribe;
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
