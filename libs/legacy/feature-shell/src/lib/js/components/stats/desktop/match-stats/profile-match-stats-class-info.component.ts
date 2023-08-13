import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ClassInfo } from './profile-match-stats.model';

@Component({
	selector: 'profile-match-stats-class-info',
	styleUrls: [
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats-columns.scss`,
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats-class-info.component.scss`,
	],
	template: `
		<div
			class="player-match-stats-class-info"
			[ngClass]="{
				battlegrounds: currentMode === 'battlegrounds',
				duels: currentMode === 'duels'
			}"
		>
			<div class="cell player-class">
				<div class="class-name">{{ classInfo.name }}</div>
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
			<div class="cell wins" *ngIf="classInfo.wins != null">
				{{ classInfo.wins }}
			</div>
			<div class="cell losses" *ngIf="classInfo.losses != null">
				{{ classInfo.losses }}
			</div>
			<div class="cell top-1" *ngIf="classInfo.top1 != null">
				{{ classInfo.top1 }}
			</div>
			<div class="cell top-4" *ngIf="classInfo.top4 != null">
				{{ classInfo.top4 }}
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMatchStatsClassInfoComponent {
	@Input() classInfo: ClassInfo;
	@Input() currentMode: string;
}
