import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { BgsHeroStat } from '../../../models/battlegrounds/stats/bgs-hero-stat';
import { getTribeIcon } from '../../../services/battlegrounds/bgs-utils';

@Component({
	selector: 'bgs-hero-tribes',
	styleUrls: [
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-selection-layout.component.scss`,
		`../../../../css/component/battlegrounds/hero-selection/bgs-hero-tribes.component.scss`,
	],
	template: `
		<div class="tribes">
			<div
				class="title"
				[helpTooltip]="'battlegrounds.hero-stats.winning-tribes-tooltip' | owTranslate"
				[owTranslate]="'battlegrounds.hero-stats.winning-tribes'"
			></div>
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
	tribes: readonly { tribe: string; percent: string }[];

	@Input() set hero(value: BgsHeroStat) {
		// this.tribes = [...value.tribesStat]
		// 	.sort((a, b) => b.percent - a.percent)
		// 	.map((stat) => ({ tribe: this.getTribe(stat.tribe), percent: stat.percent.toFixed(1) }))
		// 	.slice(0, 5);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	constructor(private readonly cdr: ChangeDetectorRef) {}

	getIcon(tribe: string): string {
		return getTribeIcon(tribe);
	}

	trackByTribeFn(index, item: { tribe: string; percent: string }) {
		return item.tribe;
	}
}
