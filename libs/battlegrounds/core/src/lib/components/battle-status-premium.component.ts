import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { ADS_SERVICE_TOKEN, AnalyticsService, IAdsService, OverwolfService } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
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
	constructor(
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {}

	showPremium() {
		console.debug('show premium');
		this.analytics.trackEvent('subscription-click', { page: 'simulator-intermediate-results' });
		this.ads.goToPremium();
	}
}
