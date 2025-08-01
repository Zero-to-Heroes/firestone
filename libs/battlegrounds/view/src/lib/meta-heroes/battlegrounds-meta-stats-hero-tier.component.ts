import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { BgsMetaHeroStatTier, BgsMetaHeroStatTierItem } from '@firestone/battlegrounds/data-access';

@Component({
	standalone: false,
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
				<!-- <div class="item-container" *ngFor="let item of tier.items; trackBy: trackByFn">
					{{ item.name }}
				</div> -->
				<battlegrounds-meta-stats-hero-info
					class="item-container"
					*ngFor="let item of tier.items; trackBy: trackByFn"
					[stat]="item"
					[positionTooltipHidden]="positionTooltipHidden"
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
	@Input() positionTooltipHidden = false;

	onHeroStatsClick(heroCardId: string) {
		this.heroStatClick.next(heroCardId);
	}

	trackByFn(index: number, stat: BgsMetaHeroStatTierItem) {
		return stat.id;
	}
}
