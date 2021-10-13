import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { Entity, EntityAsJS, EntityDefinition } from '@firestone-hs/replay-parser';
import { CardsFacadeService } from '@services/cards-facade.service';
import { MinionStat } from '../../models/battlegrounds/post-match/minion-stat';
import { RunStep } from '../../models/duels/run-step';
import { GameStat } from '../../models/mainwindow/stats/game-stat';
import { StatGameModeType } from '../../models/mainwindow/stats/stat-game-mode.type';
import { Preferences } from '../../models/preferences';
import { getReferenceTribeCardId, getTribeIcon, getTribeName } from '../../services/battlegrounds/bgs-utils';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { ShowReplayEvent } from '../../services/mainwindow/store/events/replays/show-replay-event';
import { TriggerShowMatchStatsEvent } from '../../services/mainwindow/store/events/replays/trigger-show-match-stats-event';
import { getHeroRole, isMercenaries } from '../../services/mercenaries/mercenaries-utils';
import { OverwolfService } from '../../services/overwolf.service';
import { capitalizeEachWord } from '../../services/utils';
import { normalizeCardId } from '../battlegrounds/post-match/card-utils';

declare let amplitude;
@Component({
	selector: 'replay-info',
	styleUrls: [`../../../css/global/menu.scss`, `../../../css/component/replays/replay-info.component.scss`],
	template: `
		<div class="replay-info {{ gameMode }} {{ visualResult }}" [ngClass]="{ 'mercenaries': isMercenariesGame }">
			<div class="result-color-code {{ visualResult }}"></div>

			<div class="left-info">
				<div class="group mode">
					<rank-image class="player-rank" [stat]="replayInfo" [gameMode]="gameMode"></rank-image>
				</div>

				<div class="group player-images" *ngIf="!isMercenariesGame">
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

				<div class="group mercenaries-player-images" *ngIf="isMercenariesGame">
					<div class="portrait player" *ngFor="let hero of playerStartingTeam" [cardTooltip]="hero.cardId">
						<img class="icon" [src]="hero.portraitUrl" />
						<img class="frame" [src]="hero.frameUrl" />
					</div>
					<div class="vs">VS</div>
					<div
						class="portrait opponent"
						*ngFor="let hero of opponentStartingTeam"
						[cardTooltip]="hero.cardId"
					>
						<img class="icon" [src]="hero.portraitUrl" />
						<img class="frame" [src]="hero.frameUrl" />
					</div>
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

				<div class="group tribes" *ngIf="availableTribes?.length" [helpTooltip]="tribesTooltip">
					<div class="tribe" *ngFor="let tribe of availableTribes">
						<img class="icon" [src]="tribe.icon" />
					</div>
				</div>

				<div class="group warband" *ngIf="finalWarband">
					<bgs-board
						[entities]="finalWarband.entities"
						[customTitle]="null"
						[minionStats]="finalWarband.minionStats"
						[finalBoard]="true"
						[useFullWidth]="true"
						[hideDamageHeader]="true"
						[debug]="false"
						[maxBoardHeight]="-1"
					></bgs-board>
				</div>

				<div
					class="group mmr"
					[ngClass]="{ 'positive': deltaMmr > 0, 'negative': deltaMmr < 0 }"
					*ngIf="deltaMmr != null"
				>
					<div class="value">{{ deltaMmr }}</div>
					<div class="text">MMR</div>
				</div>

				<div class="group coin" *ngIf="displayCoin && playCoinIconSvg && !isMercenariesGame">
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

	@Input() set prefs(value: Preferences) {
		if (!value || value === this.prefs) {
			return;
		}
		this._prefs = value;
		this.updateInfo();
	}

	@Input() set replay(value: GameStat | RunStep) {
		this.replayInfo = value;
		this.updateInfo();
	}

	finalWarband: KnownBoard;

	private updateInfo() {
		if (!this.replayInfo) {
			return;
		}

		this.gameMode = this.replayInfo.gameMode;
		this.isMercenariesGame = isMercenaries(this.gameMode);
		[this.playerClassImage, this.playerClassTooltip] = this.buildPlayerClassImage(
			this.replayInfo,
			true,
			this._prefs,
		);
		[this.opponentClassImage, this.opponentClassTooltip] = this.buildPlayerClassImage(
			this.replayInfo,
			false,
			this._prefs,
		);
		this.playerStartingTeam = this.buildPlayerStartingTeam(this.replayInfo, true, this._prefs);
		this.opponentStartingTeam = this.buildPlayerStartingTeam(this.replayInfo, false, this._prefs);

		this.result = this.buildMatchResultText(this.replayInfo);
		[this.playCoinIconSvg, this.playCoinTooltip] = this.buildPlayCoinIconSvg(this.replayInfo);
		this.reviewId = this.replayInfo.reviewId;

		const isBg = this.replayInfo.gameMode === 'battlegrounds';
		this.hasMatchStats = isBg;
		this.opponentName = isBg ? null : this.sanitizeName(this.replayInfo.opponentName);
		this.visualResult = isBg
			? this.replayInfo.bgsPerfectGame || parseInt(this.replayInfo.additionalResult) <= 4
				? 'won'
				: 'lost'
			: this.replayInfo.result;
		if (isBg) {
			const deltaMmr = parseInt(this.replayInfo.newPlayerRank) - parseInt(this.replayInfo.playerRank);
			// This is most likely a season reset
			if (deltaMmr < -500) {
				this.deltaMmr = parseInt(this.replayInfo.newPlayerRank);
			} else if (!isNaN(deltaMmr)) {
				this.deltaMmr = deltaMmr;
			}
			this.availableTribes = [...(this.replayInfo.bgsAvailableTribes ?? [])]
				.sort((a, b) => a - b)
				.map((race) => ({
					cardId: getReferenceTribeCardId(race),
					icon: getTribeIcon(race),
					tooltip: getTribeName(race),
				}));
			this.tribesTooltip = `Tribes available in this run: ${this.availableTribes
				.map((tribe) => tribe.tooltip)
				.join(', ')}`;
			this.bgsPerfectGame = this.result === 'Perfect!';
			this.finalWarband = this.buildFinalWarband();
		}

		const isDuelsInfo = (value: any): value is RunStep =>
			(this.replayInfo as RunStep).treasureCardId !== undefined ||
			(this.replayInfo as RunStep).lootCardIds !== undefined;
		if (isDuelsInfo(this.replayInfo)) {
			if (this.replayInfo.treasureCardId) {
				this.treasure = {
					cardId: this.replayInfo.treasureCardId,
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this.replayInfo.treasureCardId}.jpg`,
				};
			}
			if (this.replayInfo.lootCardIds?.length) {
				this.loots = this.replayInfo.lootCardIds.map((loot) => ({
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

	replayInfo: GameStat;
	_prefs: Preferences;

	_displayLoot: boolean;
	_displayShortLoot: boolean;

	visualResult: string;
	gameMode: StatGameModeType;
	isMercenariesGame: boolean;
	// deckName: string;
	playerClassImage: string;
	playerClassTooltip: string;
	opponentClassImage: string;
	opponentClassTooltip: string;

	playerStartingTeam: readonly MercenaryHero[];
	opponentStartingTeam: readonly MercenaryHero[];

	opponentName: string;
	// matchResultIconSvg: SafeHtml;
	result: string;
	playCoinIconSvg: SafeHtml;
	playCoinTooltip: SafeHtml;
	reviewId: string;
	hasMatchStats: boolean;
	deltaMmr: number;

	availableTribes: readonly InternalTribe[];
	tribesTooltip: string;

	treasure: InternalLoot;
	loots: InternalLoot[];

	private bgsPerfectGame: boolean;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly sanitizer: DomSanitizer,
		private readonly allCards: CardsFacadeService,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	showReplay() {
		if (this.bgsPerfectGame) {
			amplitude.getInstance().logEvent('load-bgs-perfect-game');
		}
		this.stateUpdater.next(new ShowReplayEvent(this.reviewId));
	}

	showStats() {
		this.stateUpdater.next(new TriggerShowMatchStatsEvent(this.reviewId));
	}

	capitalize(input: string): string {
		return capitalizeEachWord(input);
	}

	private buildPlayerClassImage(info: GameStat, isPlayer: boolean, prefs: Preferences): [string, string] {
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
		const heroCard: ReferenceCard = isPlayer
			? this.allCards.getCard(info.playerCardId)
			: this.allCards.getCard(info.opponentCardId);
		const name = heroCard.name;
		const deckName = info.playerDeckName ? ` with ${info.playerDeckName}` : '';
		const tooltip = isPlayer ? name + deckName : null;
		if (prefs?.replaysShowClassIcon) {
			const image = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${heroCard.playerClass?.toLowerCase()}.png`;
			return [image, tooltip];
		} else {
			const image = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroCard.id}.jpg`;
			return [image, tooltip];
		}
	}

	private buildPlayerStartingTeam(info: GameStat, isPlayer: boolean, prefs: Preferences): readonly MercenaryHero[] {
		if (!info.gameMode || !info.gameMode.startsWith('mercenaries')) {
			return [];
		}

		const heroTimings = isPlayer ? info.mercHeroTimings : info.mercOpponentHeroTimings;
		if (!heroTimings?.length) {
			return [];
		}

		return heroTimings
			.filter((timing) => timing.turnInPlay === 1)
			.map((timing) => {
				const initialRole = this.allCards.getCard(timing.cardId).mercenaryRole;
				const role = initialRole ? getHeroRole(initialRole) : null;
				return {
					cardId: timing.cardId,
					portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${timing.cardId}.jpg`,
					frameUrl: role
						? `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${role}.png?v=2`
						: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_neutral.png?v=2`,
					role: role,
				};
			});
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

	private buildFinalWarband(): KnownBoard {
		const postMatch = this.replayInfo.postMatchStats;
		const bgsBoard = postMatch?.boardHistory[postMatch?.boardHistory.length - 1];
		if (!bgsBoard) {
			return null;
		}

		const boardEntities = bgsBoard.board.map((boardEntity) =>
			boardEntity instanceof Entity || boardEntity.tags instanceof Map
				? Entity.create(new Entity(), boardEntity as EntityDefinition)
				: Entity.fromJS((boardEntity as unknown) as EntityAsJS),
		) as readonly Entity[];
		const normalizedIds = [
			...new Set(boardEntities.map((entity) => normalizeCardId(entity.cardID, this.allCards))),
		];
		const minionStats = normalizedIds.map(
			(cardId) =>
				({
					cardId: cardId,
				} as MinionStat),
		);

		return {
			entities: boardEntities,
			minionStats: minionStats,
		} as KnownBoard;
	}

	// private extractDamage(normalizedCardId: string, totalMinionsDamageDealt: { [cardId: string]: number }): number {
	// 	return Object.keys(totalMinionsDamageDealt)
	// 		.filter((cardId) => normalizeCardId(cardId, this.allCards) === normalizedCardId)
	// 		.map((cardId) => totalMinionsDamageDealt[cardId])
	// 		.reduce((a, b) => a + b, 0);
	// }
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

interface KnownBoard {
	readonly entities: readonly Entity[];
	// readonly title: string;
	readonly minionStats: readonly MinionStat[];
	// readonly date: string;
}

interface MercenaryHero {
	readonly cardId: string;
	readonly portraitUrl: string;
	readonly frameUrl: string;
	readonly role: 'caster' | 'fighter' | 'protector';
}
