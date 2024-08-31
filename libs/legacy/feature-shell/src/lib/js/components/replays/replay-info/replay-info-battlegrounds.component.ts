import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { getReferenceTribeCardId, getTribeIcon, getTribeName } from '@firestone-hs/reference-data';
import { Entity, EntityAsJS, EntityDefinition } from '@firestone-hs/replay-parser';
import { MinionStat } from '@firestone/battlegrounds/core';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat, StatGameModeType } from '@firestone/stats/data-access';
import { RunStep } from '../../../models/duels/run-step';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { ShowReplayEvent } from '../../../services/mainwindow/store/events/replays/show-replay-event';
import { TriggerShowMatchStatsEvent } from '../../../services/mainwindow/store/events/replays/trigger-show-match-stats-event';
import { capitalizeEachWord } from '../../../services/utils';
import { normalizeCardId } from '../../battlegrounds/post-match/card-utils';
import { extractTime } from './replay-info-ranked.component';

@Component({
	selector: 'replay-info-battlegrounds',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/replays/replay-info/replay-info.component.scss`,
		`../../../../css/component/replays/replay-info/replay-info-battlegrounds.component.scss`,
	],
	template: `
		<div class="replay-info battlegrounds {{ visualResult }}">
			<div class="result-color-code {{ visualResult }}"></div>

			<div class="left-info">
				<div class="group mode">
					<rank-image class="player-rank" [stat]="replayInfo" [gameMode]="gameMode"></rank-image>
				</div>

				<div class="group player-images">
					<img class="player-class player" [src]="playerClassImage" [helpTooltip]="playerClassTooltip" />
					<img
						class="darkmoon-ticket"
						*ngIf="hasPrizes"
						src="https://static.zerotoheroes.com/hearthstone/asset/firestone/images/bgs/ticket.png"
						[helpTooltip]="'app.replays.replay-info.bgs-prizes-tooltip' | owTranslate"
					/>
				</div>

				<div class="group result" *ngIf="result">
					<div class="result">{{ result }}</div>
				</div>

				<div class="group anomalies" *ngIf="anomalies?.length">
					<div class="item" *ngFor="let anomaly of anomalies" [cardTooltip]="anomaly.cardId">
						<img class="icon" [src]="anomaly.icon" />
					</div>
				</div>

				<div class="group tribes" *ngIf="availableTribes?.length" [helpTooltip]="tribesTooltip">
					<div class="item" *ngFor="let tribe of availableTribes">
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
					></bgs-board>
				</div>

				<div
					class="group mmr"
					[ngClass]="{ positive: deltaMmr > 0, negative: deltaMmr < 0 }"
					*ngIf="deltaMmr != null"
				>
					<div class="value">{{ deltaMmr }}</div>
					<div class="text" [owTranslate]="'app.replays.replay-info.mmr'"></div>
				</div>

				<div class="group time" *ngIf="gameTime && displayTime">
					<div class="value">{{ gameTime }}</div>
				</div>
			</div>

			<div class="right-info">
				<div class="group match-stats" *ngIf="hasMatchStats" (click)="showStats()">
					<div class="watch" *ngIf="showStatsLabel">{{ showStatsLabel }}</div>
					<div
						class="stats-icon"
						[helpTooltip]="
							!showStatsLabel ? ('app.replays.replay-info.show-stats-button-tooltip' | owTranslate) : null
						"
					>
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/replays/replays_icons.svg#match_stats" />
						</svg>
					</div>
				</div>

				<div class="replay" *ngIf="reviewId" (click)="showReplay()">
					<div class="watch" *ngIf="showReplayLabel">{{ showReplayLabel }}</div>
					<div
						class="watch-icon"
						[helpTooltip]="
							!showReplayLabel
								? ('app.replays.replay-info.watch-replay-button-tooltip' | owTranslate)
								: null
						"
					>
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
export class ReplayInfoBattlegroundsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	@Input() showStatsLabel = this.i18n.translateString('app.replays.replay-info.show-stats-button');
	@Input() showReplayLabel = this.i18n.translateString('app.replays.replay-info.watch-replay-button');
	@Input() displayTime = true;

	@Input() set replay(value: GameStat | RunStep) {
		this.replayInfo = value;
		this.updateInfo();
	}

	finalWarband: KnownBoard;

	replayInfo: GameStat;

	visualResult: string;
	gameMode: StatGameModeType;
	playerClassImage: string;
	playerClassTooltip: string;

	result: string;
	reviewId: string;
	hasMatchStats: boolean;
	deltaMmr: number;
	gameTime: string;

	hasPrizes: boolean;
	availableTribes: readonly InternalTribe[];
	tribesTooltip: string;
	anomalies: readonly InternalTribe[];
	anomaliesTooltip: string;

	private bgsPerfectGame: boolean;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly sanitizer: DomSanitizer,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
	) {
		super(cdr);
	}

	ngAfterContentInit() {
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

	private updateInfo() {
		if (!this.replayInfo) {
			return;
		}

		console.debug('setting replay info', this.replayInfo);
		this.gameMode = this.replayInfo.gameMode;
		[this.playerClassImage, this.playerClassTooltip] = this.buildPlayerClassImage(this.replayInfo, true);

		this.result = buildMatchResultText(this.replayInfo, this.i18n);
		this.reviewId = this.replayInfo.reviewId;

		const isBg =
			this.replayInfo.gameMode === 'battlegrounds' ||
			this.replayInfo.gameMode === 'battlegrounds-friendly' ||
			this.replayInfo.gameMode === 'battlegrounds-duo';
		this.hasMatchStats = isBg;
		const isDuo = this.replayInfo.gameMode === 'battlegrounds-duo';
		this.visualResult = isBg
			? this.replayInfo.bgsPerfectGame ||
			  (!isDuo && parseInt(this.replayInfo.additionalResult) <= 4) ||
			  (isDuo && parseInt(this.replayInfo.additionalResult) <= 2)
				? 'won'
				: 'lost'
			: this.replayInfo.result;
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
				tooltip: getTribeName(race, this.i18n),
			}));
		this.anomalies = [...(this.replayInfo.bgsAnomalies ?? [])]
			.sort()
			.map((anomaly) => {
				const refCard = this.allCards.getCard(anomaly);
				return {
					cardId: anomaly,
					icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${anomaly}.jpg`,
					tooltip: refCard.name,
				};
			})
			.filter((a) => !!a.cardId?.length);
		//console.debug('setting replay', this.anomalies, this.replayInfo);
		this.tribesTooltip = this.i18n.translateString('app.replays.replay-info.bgs-available-tribes-tooltip', {
			value: this.availableTribes.map((tribe) => tribe.tooltip).join(', '),
		});
		this.anomaliesTooltip = this.i18n.translateString('app.replays.replay-info.bgs-anomalies-tooltip', {
			value: this.anomalies.map((a) => a.tooltip).join(', '),
		});
		this.bgsPerfectGame = this.replayInfo.bgsPerfectGame;
		this.finalWarband = buildFinalWarband(this.replayInfo, this.allCards);
		this.hasPrizes = this.replayInfo.bgsHasPrizes;
		this.gameTime = this.i18n.translateString('global.duration.min-sec', {
			...extractTime(this.replayInfo.gameDurationSeconds),
		});
	}

	private buildPlayerClassImage(info: GameStat, isPlayer: boolean): [string, string] {
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
}

interface InternalTribe {
	cardId: string;
	icon: string;
	tooltip: string;
}

export interface KnownBoard {
	readonly entities: readonly Entity[];
	// readonly title: string;
	readonly minionStats: readonly MinionStat[];
	// readonly date: string;
}

export const buildFinalWarband = (replayInfo: GameStat, allCards: CardsFacadeService): KnownBoard => {
	const postMatch = replayInfo.postMatchStats;
	const bgsBoard = postMatch?.boardHistory[postMatch?.boardHistory.length - 1];
	if (!bgsBoard) {
		return null;
	}

	const boardEntities = bgsBoard.board.map((boardEntity) =>
		boardEntity instanceof Entity || boardEntity.tags instanceof Map
			? Entity.create(new Entity(), boardEntity as EntityDefinition)
			: Entity.fromJS(boardEntity as unknown as EntityAsJS),
	) as readonly Entity[];
	const normalizedIds = [...new Set(boardEntities.map((entity) => normalizeCardId(entity.cardID, allCards)))];
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
};

export const buildMatchResultText = (info: GameStat, i18n: LocalizationFacadeService): string => {
	if (info.additionalResult) {
		if (info.bgsPerfectGame) {
			return i18n.translateString('app.replays.replay-info.bgs-perfect-game-result');
		}
		return i18n.translateString(`app.replays.replay-info.bgs-result.${parseInt(info.additionalResult)}`);
	}
	return null;
};
