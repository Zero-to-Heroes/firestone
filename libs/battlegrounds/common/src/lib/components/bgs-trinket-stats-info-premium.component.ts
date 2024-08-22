import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AnalyticsService, ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';
import { DAILY_FREE_USES_TRINKETS } from '../services/bgs-in-game-trinkets-guardian.service';

@Component({
	selector: 'bgs-trinket-stats-info-premium',
	styleUrls: ['./bgs-trinket-stats-info-premium.component.scss'],
	template: `
		<div class="info-premium" (click)="showPremium()" [helpTooltip]="helpTooltip">
			<div class="container">
				<div class="premium-lock">
					<svg>
						<use xlink:href="assets/svg/sprite.svg#lock" />
					</svg>
				</div>
				<div class="text" [fsTranslate]="'app.arena.draft.locked-premium-info'"></div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsTrinketStatsInfoPremiumComponent {
	helpTooltip = this.i18n.translateString('battlegrounds.in-game.quests.locked-premium-info-tooltip', {
		value: DAILY_FREE_USES_TRINKETS,
	});

	constructor(
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly i18n: ILocalizationService,
	) {}

	showPremium() {
		console.debug('show premium');
		this.analytics.trackEvent('subscription-click', { page: 'bgs-trinkets-overlay' });
		this.ow.openStore();
	}
}
