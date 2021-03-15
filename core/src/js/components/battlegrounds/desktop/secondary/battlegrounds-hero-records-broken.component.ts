import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { HeroStat } from './hero-stat';

@Component({
	selector: 'battlegrounds-hero-records-broken',
	styleUrls: [
		`../../../../../css/component/battlegrounds/desktop/secondary/battlegrounds-hero-records-broken.component.scss`,
		`../../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="battlegrounds-hero-records-broken">
			<img [src]="icon" class="portrait" />
			<div class="records">
				<div class="icon">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#record_broken_score" />
					</svg>
				</div>
				<div class="value">{{ numberOfRecords }}</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsHeroRecordsBrokenComponent {
	icon: string;
	numberOfRecords: number;

	@Input() set stat(value: HeroStat) {
		this.icon = `https://static.zerotoheroes.com/hearthstone/fullcard/en/256/battlegrounds/${value.heroId}.png?v=2`;
		this.numberOfRecords = value.numberOfRecords;
	}
}
