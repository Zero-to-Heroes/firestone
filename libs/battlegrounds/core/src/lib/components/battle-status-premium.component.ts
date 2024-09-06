import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battle-status-premium',
	styleUrls: ['./battle-status-premium.component.scss'],
	template: `
		<div
			class="info-premium"
			(click)="showPremium()"
			[helpTooltip]="'battlegrounds.battle.locked-premium-info-tooltip' | fsTranslate"
		>
			<div class="container">
				<div class="premium-lock">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#lock" />
					</svg>
				</div>
				<div class="text" [fsTranslate]="'battlegrounds.battle.locked-premium-info'"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattleStatusPremiumComponent {
	constructor(private readonly ow: OverwolfService, private readonly analytics: AnalyticsService) {}

	showPremium() {
		console.debug('show premium');
		this.analytics.trackEvent('subscription-click', { page: 'simulator-intermediate-results' });
		this.ow.openStore();
	}
}
