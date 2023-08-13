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
					<div class="label">Winrate</div>
					<div class="value" [ngClass]="{ positive: overview.winrate > 51, negative: overview.winrate < 49 }">
						{{ overview.winrate == null ? '-' : overview.winrate.toFixed(1) + '%' }}
					</div>
				</div>
				<div class="info win-loss">
					<div class="label">Matches</div>
					<div class="value">
						<div class="wins">{{ overview.wins }}</div>
						<div class="losses">{{ overview.losses }}</div>
					</div>
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
