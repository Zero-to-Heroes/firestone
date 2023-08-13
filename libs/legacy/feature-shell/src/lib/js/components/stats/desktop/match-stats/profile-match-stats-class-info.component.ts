import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ClassInfo } from './profile-match-stats.model';

@Component({
	selector: 'profile-match-stats-class-info',
	styleUrls: [
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats-columns.scss`,
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats-class-info.component.scss`,
	],
	template: `
		<div class="player-match-stats-class-info">
			<div class="cell player-class">
				<img class="class-icon" [src]="classInfo.icon" [helpTooltip]="classInfo.name" />
			</div>
			<div
				class="cell winrate"
				[ngClass]="{ positive: classInfo.winrate > 51, negative: classInfo.winrate < 49 }"
			>
				{{ classInfo.winrate == null ? '-' : classInfo.winrate.toFixed(1) + '%' }}
			</div>
			<div class="cell total-matches">
				{{ classInfo.totalMatches }}
			</div>
			<div class="cell wins">
				{{ classInfo.wins }}
			</div>
			<div class="cell losses">
				{{ classInfo.losses }}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMatchStatsClassInfoComponent {
	@Input() classInfo: ClassInfo;
}
