import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { MatchStats } from '../../models/mainwindow/stats/match-stats';

@Component({
	selector: 'match-overview',
	styleUrls: [`../../../css/component/match-stats/match-overview.component.scss`],
	template: `
		<div class="match-overview">
			<div class="stats-container">
				<div class="title overview">Match overview</div>
				<div class="stat" *ngFor="let stat of overviewStats">
					<div class="stat-name">{{ stat.name }}</div>
					<div class="stat-value">{{ stat.value }}</div>
				</div>
				<div class="title face-off">Face Off</div>
				<div class="subtitle face-off">
					<!-- TODO: here we can add the player name and an icon of the avatar + show the winner -->
					<div class="face-off-player player">You</div>
					<div class="face-off-player opponent">Opponent</div>
				</div>
				<!-- TODO: color code the cells to highlight who's ahead -->
				<div class="stat face-off" *ngFor="let stat of faceOffStats">
					<div class="stat-name">{{ stat.name }}</div>
					<div class="stat-value player">{{ stat.playerValue }}</div>
					<div class="stat-value opponent">{{ stat.opponentValue }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchOverviewComponent {
	overviewStats: readonly OverviewStat[];
	faceOffStats: readonly FaceOffStat[];

	@Input() set stats(value: MatchStats) {
		if (!value) {
			this.overviewStats = [];
			this.faceOffStats = [];
			return;
		}
		this.overviewStats = [{ name: 'Number of Turns', value: value.numberOfTurns } as OverviewStat];
		this.faceOffStats = [
			{
				name: 'Total Mana Spent',
				playerValue: value.playerTotalManaSpent,
				opponentValue: value.opponentTotalManaSpent,
			} as FaceOffStat,
			{
				name: 'Total Cards Player',
				playerValue: value.playerTotalCardsPlayed,
				opponentValue: value.opponentTotalCardsPlayed,
			} as FaceOffStat,
		];
	}
}

interface OverviewStat {
	readonly name;
	readonly value;
}

interface FaceOffStat {
	readonly name;
	readonly playerValue;
	readonly opponentValue;
}
