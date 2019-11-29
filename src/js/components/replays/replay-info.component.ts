import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NGXLogger } from 'ngx-logger';
import { MatchResultType } from '../../models/mainwindow/replays/match-result.type';
import { ReplayInfo } from '../../models/mainwindow/replays/replay-info';
import { StatGameFormatType } from '../../models/mainwindow/stats/stat-game-format.type';
import { StatGameModeType } from '../../models/mainwindow/stats/stat-game-mode.type';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ShowReplayEvent } from '../../services/mainwindow/store/events/replays/show-replay-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'replay-info',
	styleUrls: [`../../../css/global/menu.scss`, `../../../css/component/replays/replay-info.component.scss`],
	template: `
		<div class="replay-info {{ gameMode }}">
			<div class="group mode">
				<img class="player-rank" [src]="playerRankImage" />
				<div class="rank-text" *ngIf="rankText">{{ rankText }}</div>
			</div>

			<div class="group player-images">
				<img class="player-class player" [src]="playerClassImage" />
				<div class="vs" *ngIf="opponentClassImage">VS</div>
				<img class="player-class opponent" [src]="opponentClassImage" *ngIf="opponentClassImage" />
				<div class="player-name opponent" *ngIf="opponentName">{{ opponentName }}</div>
			</div>

			<div class="group result">
				<div class="result-icon icon" [innerHTML]="matchResultIconSvg"></div>
				<div class="result">{{ result }}</div>
			</div>

			<div class="group coin" *ngIf="playCoinIconSvg">
				<div class="play-coin-icon icon" [innerHTML]="playCoinIconSvg"></div>
			</div>

			<div class="replay" *ngIf="reviewId" (click)="showReplay()">
				<div class="watch">Watch</div>
				<div class="watch-icon">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/replays/replays_icons.svg#match_watch" />
					</svg>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoComponent implements AfterViewInit {
	replayInfo: ReplayInfo;
	gameMode: StatGameModeType;
	playerRankImage: string;
	rankText: string;
	// deckName: string;
	playerClassImage: string;
	opponentClassImage: string;
	opponentName: string;
	matchResultIconSvg: SafeHtml;
	result: string;
	playCoinIconSvg: SafeHtml;
	reviewId: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set replay(value: ReplayInfo) {
		// this.logger.debug('[deck-replay-info] setting value', value);
		this.replayInfo = this.replayInfo;
		this.gameMode = value.gameMode;
		this.playerRankImage = this.buildPlayerRankImage(value.gameFormat, value.gameMode, value.playerRank);
		this.rankText = this.buildRankText(value);
		// this.deckName = value.playerDeckName || value.playerName;
		this.playerClassImage = this.buildPlayerClassImage(value, true);
		this.opponentClassImage = this.buildPlayerClassImage(value, false);
		this.matchResultIconSvg = this.buildMatchResultIconSvg(value.result);
		this.result = this.buildMatchResultText(value);
		this.playCoinIconSvg = this.buildPlayCoinIconSvg(value);
		this.reviewId = value.reviewId;
		this.opponentName = value.gameMode !== 'battlegrounds' ? this.sanitizeName(value.opponentName) : null;
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
		this.stateUpdater.next(new ShowReplayEvent(this.reviewId));
	}

	private buildPlayerRankImage(
		gameFormat: StatGameFormatType,
		gameMode: StatGameModeType,
		playerRank: string,
	): string {
		let rankIcon;
		if (gameMode === 'ranked') {
			const standard = 'standard_ranked';
			if (playerRank === 'legend') {
				rankIcon = `${standard}/legend`;
			} else if (!playerRank || parseInt(playerRank) >= 25) {
				rankIcon = `${standard}/rank25_small`;
			} else {
				rankIcon = `${standard}/rank${parseInt(playerRank)}_small`;
			}
		} else if (gameMode === 'battlegrounds') {
			rankIcon = 'battlegrounds';
		} else if (gameMode === 'practice') {
			rankIcon = 'casual';
		} else if (gameMode === 'casual') {
			rankIcon = 'casual';
		} else if (gameMode === 'friendly') {
			rankIcon = 'friendly';
		} else if (gameMode === 'arena') {
			rankIcon = 'arena/arena12wins';
		} else if (gameMode === 'tavern-brawl') {
			rankIcon = 'tavernbrawl';
		} else {
			rankIcon = 'arenadraft';
		}
		return `/Files/assets/images/deck/ranks/${rankIcon}.png`;
	}

	private buildPlayerClassImage(info: ReplayInfo, isPlayer: boolean): string {
		if (info.gameMode === 'battlegrounds') {
			if (!isPlayer) {
				return null;
			} else if (info.playerSkin) {
				return `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.playerSkin}.jpg`;
			} else {
				// Return Bob to not have an empty image
				return `https://static.zerotoheroes.com/hearthstone/cardart/256x/TB_BaconShop_HERO_PH.jpg`;
			}
		}
		return isPlayer
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.playerSkin}.jpg`
			: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.opponentSkin}.jpg`;
	}

	private buildMatchResultIconSvg(result: MatchResultType): SafeHtml {
		const iconName = result === 'won' ? 'match_result_victory' : 'match_result_defeat';
		return this.sanitizer.bypassSecurityTrustHtml(`
			<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/replays/replays_icons.svg#${iconName}"/>
			</svg>
		`);
	}

	private buildMatchResultText(info: ReplayInfo): string {
		if (info.gameMode === 'battlegrounds' && info.additionalResult) {
			// prettier-ignore
			switch (parseInt(info.additionalResult)) {
				case 1: return '1st place';
				case 2: return '2nd place';
				case 3: return '3rd place';
				case 4: return '4th place';
				case 5: return '5th place';
				case 6: return '6th place';
				case 7: return '7th place';
				case 8: return '8th place';
			}
		}
		// prettier-ignore
		switch (info.result) {
			case 'won': return 'Victory';
			case 'lost': return 'Defeat';
			case 'tied': return 'Tie';
			default: return 'Unknown';
		}
	}

	private buildPlayCoinIconSvg(info: ReplayInfo): SafeHtml {
		if (info.gameMode === 'battlegrounds') {
			return null;
		}
		const iconName = info.coinPlay === 'coin' ? 'match_coin' : 'match_play';
		return this.sanitizer.bypassSecurityTrustHtml(`
			<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/replays/replays_icons.svg#${iconName}"/>
			</svg>
		`);
	}

	private buildRankText(info: ReplayInfo): string {
		if (info.gameMode === 'ranked' || info.gameMode === 'battlegrounds') {
			return info.playerRank;
		}
		return null;
	}

	private sanitizeName(name: string) {
		if (!name || name.indexOf('#') === -1) {
			return name;
		}
		return name.split('#')[0];
	}
}
