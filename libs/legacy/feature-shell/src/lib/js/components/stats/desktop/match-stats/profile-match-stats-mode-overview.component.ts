import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ModeOverview } from './profile-match-stats.model';

@Component({
	selector: 'profile-match-stats-mode-overview',
	styleUrls: [
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats-mode-overview.component.scss`,
	],
	template: `
		<div class="player-match-stats-mode-overview {{ overview.mode }}" [ngClass]="{ active: active }">
			<div class="title">{{ overview.title }}</div>
			<img class="icon" [src]="overview.icon" />
			<div class="info-container">
				<div class="info winrate">
					<div class="label" [owTranslate]="'app.profile.match-stats.header-winrate'"></div>
					<div class="value" [ngClass]="{ positive: overview.winrate > 51, negative: overview.winrate < 49 }">
						{{ overview.winrate == null ? '-' : overview.winrate.toFixed(1) + '%' }}
					</div>
				</div>
				<div class="info win-loss">
					<div class="label" [owTranslate]="'app.profile.match-stats.header-total-matches-short'"></div>
					<div class="value">
						<div class="wins" *ngIf="overview.wins != null" [helpTooltip]="overview.winsTooltip">
							{{ overview.wins }}
						</div>
						<div
							class="losses"
							*ngIf="overview.losses != null"
							[helpTooltip]="'app.profile.match-stats.header-losses' | owTranslate"
						>
							{{ overview.losses }}
						</div>
					</div>
					<div class="sub-value" *ngIf="overview.top1 != null" [innerHTML]="overview.top1Tooltip"></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMatchStatsModeOverviewComponent {
	@Input() overview: ModeOverview;
	@Input() active: boolean;
}
