import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DuelsMetaStatsTier } from './duels-meta-stats-tier';

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
				<duels-meta-stats-tier-card-info class="item-container" *ngFor="let item of tier.items" [stat]="item">
				</duels-meta-stats-tier-card-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsMetaStatsTierTierComponent {
	@Input() tier: DuelsMetaStatsTier;
}
