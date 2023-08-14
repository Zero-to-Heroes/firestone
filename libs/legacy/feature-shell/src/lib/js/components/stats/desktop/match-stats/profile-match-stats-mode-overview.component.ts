import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ModeOverview } from './profile-match-stats.model';

@Component({
	selector: 'profile-match-stats-mode-overview',
	styleUrls: [
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats-mode-overview.component.scss`,
	],
	template: `
		<div class="player-match-stats-mode-overview" [ngClass]="{ active: active }">
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
						<!-- <div
							class="top-1"
							*ngIf="overview.top1 != null"
							[helpTooltip]="'app.profile.match-stats.header-top-1' | owTranslate"
						>
							{{ overview.top1 }}
						</div>
						<div
							class="top-4"
							*ngIf="overview.top4 != null"
							[helpTooltip]="'app.profile.match-stats.header-top-4' | owTranslate"
						>
							{{ overview.top4 }}
						</div>
						<div
							class="games-played"
							*ngIf="overview.gamesPlayed != null"
							[helpTooltip]="'app.profile.match-stats.header-total-matches' | owTranslate"
						>
							{{ overview.gamesPlayed }}
						</div> -->
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
