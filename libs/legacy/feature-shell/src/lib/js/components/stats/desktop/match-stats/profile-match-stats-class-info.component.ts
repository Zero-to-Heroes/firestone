// import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
// import { ClassInfo } from './profile-match-stats.model';

// @Component({
// 	selector: 'profile-match-stats-class-info',
// 	styleUrls: [`../../../../css/component/stats/desktop/profile-match-stats-class-info.component.scss`],
// 	template: `
// 		<div class="player-match-stats-class-info">
// 			<div class="player-class">
// 				<img class="class-icon" [src]="classInfo.icon" [helpTooltip]="classInfo.name" />
// 			</div>
// 			<div class="total-matches">
// 				{{ classInfo.totalMatches }}
// 			</div>
// 			<div class="winrate">
// 				{{ classInfo.winrate }}
// 			</div>
// 			<div class="wins">
// 				{{ classInfo.wins }}
// 			</div>
// 			<div class="losses">
// 				{{ classInfo.losses }}
// 			</div>
// 		</div>
// 	`,
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class ProfileMatchStatsClassInfoComponent {
// 	@Input() classInfo: ClassInfo;
// }
