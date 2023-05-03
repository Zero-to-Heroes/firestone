import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DuelsMetaStats, DuelsMetaStatsTier } from './duels-meta-stats-tier';

@Component({
	selector: 'duels-meta-stats-tier',
	styleUrls: [`./duels-meta-stats-tier.component.scss`],
	template: `
		<div class="tier" *ngIf="tier">
			<div
				*ngIf="tier.label"
				class="header {{ tier.label?.toLowerCase() }}"
				[helpTooltip]="tier.tooltip"
				[helpTooltipPosition]="'top'"
			>
				{{ tier.label }}
			</div>
			<div class="items">
				<duels-meta-stats-tier-card-info
					class="item-container"
					*ngFor="let item of tier.items"
					[stat]="item"
					[hoverEffect]="true"
					(statsClicked)="onStatsClicked($event)"
				>
				</duels-meta-stats-tier-card-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMetaStatsTierTierComponent {
	@Output() statsClicked = new EventEmitter<DuelsMetaStats>();

	@Input() tier: DuelsMetaStatsTier;
	@Input() hoverEffect = false;

	onStatsClicked(stat: DuelsMetaStats) {
		this.statsClicked.next(stat);
	}
}
