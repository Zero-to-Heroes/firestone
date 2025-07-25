import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { GameStat, buildRankText } from '@firestone/stats/data-access';

@Component({
	standalone: false,
	selector: 'rank-image',
	styleUrls: [`./rank-image.component.scss`],
	template: `
		<div
			class="rank-image {{ gameMode }}"
			[helpTooltip]="
				rankTooltip
					? rankTooltip
					: playerRankImageTooltip
					? playerRankImageTooltip
					: rankIssue
					? rankIssueTooltip
					: null
			"
			[ngClass]="{ legend: isLegend }"
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

		if (!value.buildPlayerRankImage) {
			value = GameStat.create(value);
		}

		this.playerRank = value.playerRank;
		this.isLegend = value.playerRank != null ? `${value.playerRank}`?.startsWith('legend') : false;
		const rankImage = value.buildPlayerRankImage(this.i18n);
		this.playerRankImage = rankImage.frameImage;
		this.playerRankArt = rankImage.medalImage;
		this.playerRankImageTooltip = rankImage.tooltip;
		this.playerRankDecoration = rankImage.frameDecoration;
		this.rankText = buildRankText(value.playerRank, value.gameMode, value.additionalResult);
		this.rankIssue =
			!this.playerRank &&
			![
				'mercenaries-ai-vs-ai',
				'mercenaries-pve',
				'mercenaries-pve-coop',
				'mercenaries-friendly',
				'unknown',
				'arena-draft',
				'casual',
				'friendly',
				'practice',
				'tutorial',
				'tavern-brawl',
			].includes(value.gameMode);
	}

	@Input() gameMode: string;
	@Input() rankTooltip: string;

	playerRank: string | undefined;
	playerRankImage: string | undefined;
	playerRankArt: string | undefined;
	playerRankDecoration: string | undefined;
	playerRankImageTooltip: string | undefined;
	isLegend: boolean | undefined;
	rankText: string | undefined;
	rankIssue: boolean | undefined;
	rankIssueTooltip = this.i18n.translateString('app.replays.replay-info.rank-issue-tooltip');

	constructor(private readonly i18n: ILocalizationService) {}
}
