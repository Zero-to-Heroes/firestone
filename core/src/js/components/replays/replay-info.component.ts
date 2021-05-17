import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { RunStep } from '../../models/duels/run-step';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { StatGameModeType } from '../../models/mainwindow/stats/stat-game-mode.type';
import { getReferenceTribeCardId, getTribeIcon, getTribeName } from '../../services/battlegrounds/bgs-utils';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ShowReplayEvent } from '../../services/mainwindow/store/events/replays/show-replay-event';
import { TriggerShowMatchStatsEvent } from '../../services/mainwindow/store/events/replays/trigger-show-match-stats-event';
import { OverwolfService } from '../../services/overwolf.service';
import { capitalizeEachWord } from '../../services/utils';

@Component({
	selector: 'replay-info',
	styleUrls: [`../../../css/global/menu.scss`, `../../../css/component/replays/replay-info.component.scss`],
	template: `
		<div class="replay-info {{ gameMode }} {{ visualResult }}">
			<div class="result-color-code {{ visualResult }}"></div>

			<div class="left-info">
				<div class="group mode">
					<rank-image class="player-rank" [stat]="replayInfo" [gameMode]="gameMode"></rank-image>
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

				<div class="group loot" *ngIf="_displayLoot && loots?.length">
					<div
						class="icon"
						inlineSVG="assets/svg/loot.svg"
						helpTooltip="Cards added to deck after this round "
					></div>
					<img *ngFor="let loot of loots" class="pick" [src]="loot.icon" [cardTooltip]="loot.cardId" />
				</div>

				<div class="group short-loot" *ngIf="!_displayLoot && _displayShortLoot && loots?.length">
					<div
						class="icon"
						inlineSVG="assets/svg/loot.svg"
						helpTooltip="Cards added to deck after this round "
					></div>
					<img *ngFor="let loot of loots" class="pick" [src]="loot.icon" [cardTooltip]="loot.cardId" />
				</div>

				<div class="group treasure" *ngIf="_displayLoot && treasure">
					<div
						class="icon"
						inlineSVG="assets/svg/treasure.svg"
						helpTooltip="Treasure added to deck after this round"
					></div>
					<img class="pick" [src]="treasure.icon" [cardTooltip]="treasure.cardId" />
				</div>

				<div class="group short-treasure" *ngIf="!_displayLoot && _displayShortLoot && treasure">
					<div
						class="icon"
						inlineSVG="assets/svg/treasure.svg"
						helpTooltip="Treasure added to deck after this round"
					></div>
					<img class="pick" [src]="treasure.icon" [cardTooltip]="treasure.cardId" />
				</div>

				<!-- <div class="group result-text {{ visualResult }}" *ngIf="gameMode !== 'battlegrounds'">
					{{ capitalize(visualResult) }}
				</div> -->

				<div class="group result" *ngIf="result">
					<!-- <div class="result-icon icon" *ngIf="matchResultIconSvg" [innerHTML]="matchResultIconSvg"></div> -->
					<div class="result">{{ result }}</div>
				</div>

				<div class="group tribes" *ngIf="availableTribes?.length">
					<div class="tribe" *ngFor="let tribe of availableTribes">
						<img class="icon" [src]="tribe.icon" [helpTooltip]="tribe.tooltip" />
					</div>
				</div>

				<div
					class="group mmr"
					[ngClass]="{ 'positive': deltaMmr > 0, 'negative': deltaMmr < 0 }"
					*ngIf="deltaMmr != null"
				>
					<div class="value">{{ deltaMmr }}</div>
					<div class="text">MMR</div>
				</div>

				<div class="group coin" *ngIf="displayCoin && playCoinIconSvg">
					<div
						class="play-coin-icon icon"
						[innerHTML]="playCoinIconSvg"
						[helpTooltip]="playCoinTooltip"
					></div>
				</div>
			</div>

			<div class="right-info">
				<div class="group match-stats" *ngIf="hasMatchStats" (click)="showStats()">
					<div class="watch" *ngIf="showStatsLabel">{{ showStatsLabel }}</div>
					<div class="stats-icon" [helpTooltip]="!showStatsLabel ? 'Show stats' : null">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/replays/replays_icons.svg#match_stats" />
						</svg>
					</div>
				</div>

				<div class="replay" *ngIf="reviewId" (click)="showReplay()">
					<div class="watch" *ngIf="showReplayLabel">{{ showReplayLabel }}</div>
					<div class="watch-icon" [helpTooltip]="!showReplayLabel ? 'Watch replay' : null">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/replays/replays_icons.svg#match_watch" />
						</svg>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayInfoComponent implements AfterViewInit {
	@Input() showStatsLabel = 'Stats';
	@Input() showReplayLabel = 'Watch';
	@Input() displayCoin = true;

	replayInfo: GameStat;
	visualResult: string;
	gameMode: StatGameModeType;
	// deckName: string;
	playerClassImage: string;
	playerClassTooltip: string;
	opponentClassImage: string;
	opponentClassTooltip: string;
	opponentName: string;
	// matchResultIconSvg: SafeHtml;
	result: string;
	playCoinIconSvg: SafeHtml;
	playCoinTooltip: SafeHtml;
	reviewId: string;
	hasMatchStats: boolean;
	deltaMmr: number;

	availableTribes: readonly InternalTribe[];

	treasure: InternalLoot;
	loots: InternalLoot[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	@Input() set replay(value: GameStat | RunStep) {
		this.replayInfo = value;
		this.gameMode = value.gameMode;
		// this.deckName = value.playerDeckName || value.playerName;
		[this.playerClassImage, this.playerClassTooltip] = this.buildPlayerClassImage(value, true);
		[this.opponentClassImage, this.opponentClassTooltip] = this.buildPlayerClassImage(value, false);
		// this.matchResultIconSvg = this.buildMatchResultIconSvg(value);
		this.result = this.buildMatchResultText(value);
		[this.playCoinIconSvg, this.playCoinTooltip] = this.buildPlayCoinIconSvg(value);
		this.reviewId = value.reviewId;

		const isBg = value.gameMode === 'battlegrounds';
		this.hasMatchStats = isBg;
		this.opponentName = isBg ? null : this.sanitizeName(value.opponentName);
		this.visualResult = isBg
			? value.bgsPerfectGame || parseInt(value.additionalResult) <= 4
				? 'won'
				: 'lost'
			: value.result;
		if (isBg) {
			const deltaMmr = parseInt(value.newPlayerRank) - parseInt(value.playerRank);
			// This is most likely a season reset
			if (deltaMmr < -500) {
				this.deltaMmr = parseInt(value.newPlayerRank);
			} else if (!isNaN(deltaMmr)) {
				this.deltaMmr = deltaMmr;
			}
			this.availableTribes = [...value.bgsAvailableTribes]
				.sort((a, b) => a - b)
				.map((race) => ({
					cardId: getReferenceTribeCardId(race),
					icon: getTribeIcon(race),
					tooltip: getTribeName(race),
				}));
			// console.debug('availableTribes', this.availableTribes);
		}

		const isDuelsInfo = (value: any): value is RunStep =>
			(value as RunStep).treasureCardId !== undefined || (value as RunStep).lootCardIds !== undefined;
		if (isDuelsInfo(value)) {
			if (value.treasureCardId) {
				this.treasure = {
					cardId: value.treasureCardId,
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.treasureCardId}.jpg`,
				};
			}
			if (value.lootCardIds?.length) {
				this.loots = value.lootCardIds.map((loot) => ({
					cardId: loot,
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${loot}.jpg`,
				}));
			}
		}
	}

	@Input() set displayLoot(value: boolean) {
		this._displayLoot = value;
	}

	@Input() set displayShortLoot(value: boolean) {
		this._displayShortLoot = value;
	}

	_displayLoot: boolean;
	_displayShortLoot: boolean;

	constructor(
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

	showStats() {
		this.stateUpdater.next(new TriggerShowMatchStatsEvent(this.reviewId));
	}

	capitalize(input: string): string {
		return capitalizeEachWord(input);
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
		const deckName = info.playerDeckName ? ` with ${info.playerDeckName}` : '';
		const tooltip = name + deckName;
		const image = isPlayer
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.playerCardId}.jpg`
			: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.opponentCardId}.jpg`;
		return [image, tooltip];
	}

	private buildMatchResultIconSvg(info: GameStat): SafeHtml {
		if (info.gameMode === 'battlegrounds') {
			return null;
		}
		const iconName = info.result === 'won' ? 'match_result_victory' : 'match_result_defeat';
		return this.sanitizer.bypassSecurityTrustHtml(`
			<svg class="svg-icon-fill">
				<use xlink:href="assets/svg/replays/replays_icons.svg#${iconName}"/>
			</svg>
		`);
	}

	private buildMatchResultText(info: GameStat): string {
		if (info.gameMode === 'battlegrounds' && info.additionalResult) {
			if (info.bgsPerfectGame) {
				return 'Perfect!';
			}
			// prettier-ignore
			switch (parseInt(info.additionalResult)) {
				case 1: return '1st';
				case 2: return '2nd';
				case 3: return '3rd';
				case 4: return '4th';
				case 5: return '5th';
				case 6: return '6th';
				case 7: return '7th';
				case 8: return '8th';
			}
		}
		return null;
		// prettier-ignore
		// switch (info.result) {
		// 	case 'won': return 'Victory';
		// 	case 'lost': return 'Defeat';
		// 	case 'tied': return 'Tie';
		// 	default: return 'Unknown';
		// }
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
				<use xlink:href="assets/svg/replays/replays_icons.svg#${iconName}"/>
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

interface InternalLoot {
	icon: string;
	cardId: string;
}

interface InternalTribe {
	cardId: string;
	icon: string;
	tooltip: string;
}
