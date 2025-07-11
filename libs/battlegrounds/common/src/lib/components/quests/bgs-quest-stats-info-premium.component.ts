import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { BGS_QUESTS_DAILY_FREE_USES } from '@firestone/shared/common/service';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	IAdsService,
	ILocalizationService,
	OverwolfService,
} from '@firestone/shared/framework/core';

@Component({
	selector: 'bgs-quest-stats-info-premium',
	styleUrls: ['./bgs-quest-stats-info-premium.component.scss'],
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
export class BgsQuestStatsInfoPremiumComponent {
	helpTooltip = this.i18n.translateString('battlegrounds.in-game.quests.locked-premium-info-tooltip', {
		value: BGS_QUESTS_DAILY_FREE_USES,
	});

	constructor(
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly i18n: ILocalizationService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {}

	showPremium() {
		console.debug('show premium');
		this.analytics.trackEvent('subscription-click', { page: 'bgs-quests-overlay' });
		this.ads.goToPremium();
	}
}
