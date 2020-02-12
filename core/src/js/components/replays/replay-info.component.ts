import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { NGXLogger } from 'ngx-logger';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
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
				<img class="player-rank" [src]="playerRankImage" [helpTooltip]="playerRankImageTooltip" />
				<div class="rank-text" *ngIf="rankText">{{ rankText }}</div>
			</div>

			<div class="group player-images">
				<img class="player-class player" [src]="playerClassImage" [helpTooltip]="playerClassTooltip" />
				<div class="vs" *ngIf="opponentClassImage">VS</div>
				<img
					class="player-class opponent"
					[src]="opponentClassImage"
					[helpTooltip]="opponentClassTooltip"
					*ngIf="opponentClassImage"
				/>
				<div class="player-name opponent" *ngIf="opponentName">{{ opponentName }}</div>
			</div>

			<div class="group result">
				<div class="result-icon icon" *ngIf="matchResultIconSvg" [innerHTML]="matchResultIconSvg"></div>
				<div class="result">{{ result }}</div>
			</div>

			<div class="group coin" *ngIf="playCoinIconSvg">
				<div class="play-coin-icon icon" [innerHTML]="playCoinIconSvg" [helpTooltip]="playCoinTooltip"></div>
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
	replayInfo: GameStat;
	gameMode: StatGameModeType;
	playerRankImage: string;
	playerRankImageTooltip: string;
	rankText: string;
	// deckName: string;
	playerClassImage: string;
	playerClassTooltip: string;
	opponentClassImage: string;
	opponentClassTooltip: string;
	opponentName: string;
	matchResultIconSvg: SafeHtml;
	result: string;
	playCoinIconSvg: SafeHtml;
	playCoinTooltip: SafeHtml;
	reviewId: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set replay(value: GameStat) {
		// this.logger.debug('[deck-replay-info] setting value', value);
		this.replayInfo = this.replayInfo;
		this.gameMode = value.gameMode;
		[this.playerRankImage, this.playerRankImageTooltip] = value.buildPlayerRankImage();
		this.rankText = value.buildRankText();
		// this.deckName = value.playerDeckName || value.playerName;
		[this.playerClassImage, this.playerClassTooltip] = this.buildPlayerClassImage(value, true);
		[this.opponentClassImage, this.opponentClassTooltip] = this.buildPlayerClassImage(value, false);
		this.matchResultIconSvg = this.buildMatchResultIconSvg(value);
		this.result = this.buildMatchResultText(value);
		[this.playCoinIconSvg, this.playCoinTooltip] = this.buildPlayCoinIconSvg(value);
		this.reviewId = value.reviewId;
		this.opponentName = value.gameMode !== 'battlegrounds' ? this.sanitizeName(value.opponentName) : null;
	}

	constructor(
		private readonly logger: NGXLogger,
		private readonly ow: OverwolfService,
		private readonly sanitizer: DomSanitizer,
		private readonly allCards: AllCardsService,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	showReplay() {
		this.stateUpdater.next(new ShowReplayEvent(this.reviewId));
	}

	private buildPlayerClassImage(info: GameStat, isPlayer: boolean): [string, string] {
		if (info.gameMode === 'battlegrounds') {
			if (!isPlayer) {
				return [null, null];
			} else if (info.playerCardId) {
				const card = this.allCards.getCard(info.playerCardId);
				return [`https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.playerCardId}.jpg`, card.name];
			} else {
				// Return Bob to not have an empty image
				return [`https://static.zerotoheroes.com/hearthstone/cardart/256x/TB_BaconShop_HERO_PH.jpg`, null];
			}
		}
		const name = isPlayer
			? this.allCards.getCard(info.playerCardId).name
			: this.allCards.getCard(info.opponentCardId).name;
		const image = isPlayer
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.playerCardId}.jpg`
			: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.opponentCardId}.jpg`;
		return [image, name];
	}

	private buildMatchResultIconSvg(info: GameStat): SafeHtml {
		if (info.gameMode === 'battlegrounds') {
			return null;
		}
		const iconName = info.result === 'won' ? 'match_result_victory' : 'match_result_defeat';
		return this.sanitizer.bypassSecurityTrustHtml(`
			<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/replays/replays_icons.svg#${iconName}"/>
			</svg>
		`);
	}

	private buildMatchResultText(info: GameStat): string {
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

	private buildPlayCoinIconSvg(info: GameStat): [SafeHtml, string] {
		if (info.gameMode === 'battlegrounds') {
			return [null, null];
		}
		const iconName = info.coinPlay === 'coin' ? 'match_coin' : 'match_play';
		const tooltip = info.coinPlay === 'coin' ? 'Had the Coin' : 'Went first';
		return [
			this.sanitizer.bypassSecurityTrustHtml(`
			<svg class="svg-icon-fill">
				<use xlink:href="/Files/assets/svg/replays/replays_icons.svg#${iconName}"/>
			</svg>
		`),
			tooltip,
		];
	}

	private sanitizeName(name: string) {
		if (!name || name.indexOf('#') === -1) {
			return name;
		}
		return name.split('#')[0];
	}
}
