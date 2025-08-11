import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ArenaClassTier } from './model';

@Component({
	standalone: false,
	selector: 'arena-class-tier-list-tier',
	styleUrls: [`./arena-class-tier-list-tier.component.scss`],
	template: `
		<div class="tier" *ngIf="tier">
			<div
				*ngIf="tier.label"
				class="header {{ tier.label.toLowerCase() }}"
				[helpTooltip]="tier.tooltip"
				[helpTooltipPosition]="'top'"
			>
				{{ tier.label }}
			</div>
			<div class="items">
				<arena-class-info class="item-container" *ngFor="let item of tier.items" [stat]="item">
				</arena-class-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassTierListTierComponent {
	@Input() tier: ArenaClassTier;
}
