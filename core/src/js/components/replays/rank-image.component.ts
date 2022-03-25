import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { buildRankText, GameStat } from '../../models/mainwindow/stats/game-stat';

@Component({
	selector: 'rank-image',
	styleUrls: [`../../../css/global/menu.scss`, `../../../css/component/replays/rank-image.component.scss`],
	template: `
		<div
			class="rank-image {{ gameMode }}"
			[helpTooltip]="rankTooltip ? rankTooltip : playerRank ? playerRankImageTooltip : rankIssueTooltip"
		>
			<div class="icon {{ gameMode }}" [ngClass]="{ 'missing-rank': !rankText }">
				<img class="art" *ngIf="playerRankArt" [src]="playerRankArt" />
				<img class="frame" *ngIf="playerRankImage" [src]="playerRankImage" />
				<img class="decoration" *ngIf="playerRankDecoration" [src]="playerRankDecoration" />
			</div>
			<div class="rank-text" *ngIf="rankText">{{ rankText }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RankImageComponent {
	@Input() set stat(value: GameStat) {
		if (!value) {
			return;
		}

		this.playerRank = value.playerRank;
		const rankImage = value.buildPlayerRankImage(this.i18n);
		this.playerRankImage = rankImage.frameImage;
		this.playerRankArt = rankImage.medalImage;
		this.playerRankImageTooltip = rankImage.tooltip;
		this.playerRankDecoration = rankImage.frameDecoration;
		this.rankText = buildRankText(value.playerRank, value.gameMode, value.additionalResult);
	}

	@Input() gameMode: string;
	@Input() rankTooltip: string;

	playerRank: string;
	playerRankImage: string;
	playerRankArt: string;
	playerRankDecoration: string;
	playerRankImageTooltip: string;
	rankText: string;
	rankIssueTooltip = this.i18n.translateString('app.replays.replay-info.rank-issue-tooltip');

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
