import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';
import { CoinPlayType } from '../../../models/mainwindow/decktracker/coin-play.type';
import { DeckReplayInfo } from '../../../models/mainwindow/decktracker/deck-replay-info';
import { MatchResultType } from '../../../models/mainwindow/decktracker/match-result.type';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'deck-replay-info',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/deck-replay-info.component.scss`,
	],
	template: `
		<div class="deck-replay-info">
			<img class="player-rank" [src]="playerRankImage" />
			<div class="player-name player">{{ deckName }}</div>
			<img class="player-class player" [src]="playerClassImage" />
			<div class="vs">VS</div>
			<img class="player-class opponent" [src]="opponentClassImage" />
			<div class="player-name opponent">{{ opponentName }}</div>
			<div class="divider"></div>
			<div class="result-icon icon" [innerHTML]="matchResultIconSvg"></div>
			<div class="result">{{ result }}</div>
			<div class="divider"></div>
			<div class="play-coin-icon icon" [innerHTML]="playCoinIconSvg"></div>
			<div class="replay" *ngIf="reviewId">
				<div class="watch">Watch</div>
				<div class="watch-icon" (click)="showReplay()">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#match_watch" />
					</svg>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeckReplayInfoComponent implements AfterViewInit {
	playerRankImage: string;
	deckName: string;
	playerClassImage: string;
	opponentClassImage: string;
	opponentName: string;
	matchResultIconSvg: SafeHtml;
	result: string;
	playCoinIconSvg: SafeHtml;
	reviewId: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set replay(value: DeckReplayInfo) {
		this.logger.debug('[deck-replay-info] setting value', value);
		this.playerRankImage = this.buildPlayerRankImage(value.playerRank);
		this.deckName = value.playerDeckName || value.playerName;
		this.playerClassImage = this.buildPlayerClassImage(value.playerClass);
		this.opponentClassImage = this.buildPlayerClassImage(value.opponentClass);
		this.matchResultIconSvg = this.buildMatchResultIconSvg(value.result);
		this.result = this.buildMatchResultText(value.result);
		this.playCoinIconSvg = this.buildPlayCoinIconSvg(value.coinPlay);
		this.reviewId = value.reviewId;
		this.opponentName = value.opponentName;
	}

	constructor(
		private readonly logger: NGXLogger,
		private readonly ow: OverwolfService,
		private readonly sanitizer: DomSanitizer,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	showReplay() {
		// this.stateUpdater.next(new ShowDeckReplayEvent(null));
		// this.stateUpdater.next(new ShowDeckReplayEvent(this.reviewId));
	}

	private buildPlayerRankImage(playerRank: string): string {
		let rankIcon;
		if (playerRank === 'legend') {
			rankIcon = 'legend';
		} else if (!playerRank || parseInt(playerRank) >= 25) {
			rankIcon = 'rank25_small';
		} else {
			rankIcon = `rank${parseInt(playerRank)}_small`;
		}
		return `/Files/assets/images/deck/ranks/${rankIcon}.png`;
	}

	private buildPlayerClassImage(playerClass: string): string {
		return `/Files/assets/images/deck/classes/${playerClass}.png`;
	}

	private buildMatchResultIconSvg(result: MatchResultType): SafeHtml {
		const iconName = result === 'won' ? 'match_result_victory' : 'match_result_defeat';
		return this.sanitizer.bypassSecurityTrustHtml(`
			<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/sprite.svg#${iconName}"/>
			</svg>
		`);
	}

	private buildMatchResultText(result: MatchResultType): string {
		// prettier-ignore
		switch (result) {
			case 'won': return 'Victory';
			case 'lost': return 'Defeat';
			case 'tied': return 'Tie';
		}
	}

	private buildPlayCoinIconSvg(result: CoinPlayType): SafeHtml {
		const iconName = result === 'coin' ? 'match_coin' : 'match_play';
		return this.sanitizer.bypassSecurityTrustHtml(`
			<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/sprite.svg#${iconName}"/>
			</svg>
		`);
	}
}
