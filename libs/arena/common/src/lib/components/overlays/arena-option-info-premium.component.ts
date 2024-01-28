import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { AnalyticsService, OverwolfService } from '@firestone/shared/framework/core';

@Component({
	selector: 'arena-option-info-premium',
	styleUrls: ['./arena-option-info-premium.component.scss'],
	template: `
		<div
			class="info-premium"
			[ngClass]="{ extended: extended }"
			(click)="showPremium()"
			[helpTooltip]="'app.arena.draft.locked-premium-info-tooltip' | fsTranslate"
		>
			<div class="extended-info">
				<div class="logo" inlineSVG="assets/svg/firestone_logo_no_text.svg"></div>
				<div class="title">Firestone</div>
			</div>
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
export class ArenaOptionInfoPremiumComponent {
	@Input() extended: boolean;

	constructor(private readonly ow: OverwolfService, private readonly analytics: AnalyticsService) {}

	showPremium() {
		console.debug('show premium');
		this.analytics.trackEvent('subscription-click', { page: 'arena-card-pick' });
		this.ow.openStore();
	}
}
