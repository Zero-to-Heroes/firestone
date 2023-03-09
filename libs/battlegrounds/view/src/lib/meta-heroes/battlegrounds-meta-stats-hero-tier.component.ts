import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BgsMetaHeroStatTier } from '@firestone/battlegrounds/data-access';

@Component({
	selector: 'battlegrounds-meta-stats-hero-tier',
	styleUrls: [`./battlegrounds-meta-stats-hero-tier.component.scss`],
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
				<battlegrounds-meta-stats-hero-info
					class="item-container"
					*ngFor="let item of tier.items"
					[stat]="item"
					(heroStatClick)="onHeroStatsClick($event)"
				>
				</battlegrounds-meta-stats-hero-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMetaStatsHeroTierComponent {
	@Output() heroStatClick = new EventEmitter<string>();

	@Input() tier: BgsMetaHeroStatTier;

	onHeroStatsClick(heroCardId: string) {
		this.heroStatClick.next(heroCardId);
	}
}
