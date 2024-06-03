/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AnalyticsService, ILocalizationService, OverwolfService } from '@firestone/shared/framework/core';

@Component({
	selector: 'mulligan-info-premium',
	styleUrls: ['./mulligan-info-premium.component.scss'],
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
export class MulliganInfoPremiumComponent {
	@Input() set dailyFreeUses(value: number) {
		this.helpTooltip = this.i18n.translateString('decktracker.overlay.mulligan.locked-premium-info-tooltip', {
			value: value,
		})!;
	}

	@Input() set type(value: 'arena' | 'constructed') {
		this.page = value === 'constructed' ? 'constructed-mulligan' : 'arena-mulligan';
	}

	helpTooltip: string;
	page: string;

	constructor(
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly i18n: ILocalizationService,
	) {}

	showPremium() {
		console.debug('show premium');
		this.analytics.trackEvent('subscription-click', { page: this.page });
		this.ow.openStore();
	}
}
