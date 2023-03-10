import { Injectable } from '@angular/core';
import { decode } from '@firestone-hs/deckstrings';
import { parseHsReplayString } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { GameType } from '@firestone-hs/reference-data';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { Events } from '@legacy-import/src/lib/js/services/events.service';
import { GameForUpload } from '@legacy-import/src/lib/js/services/manastorm-bridge/game-for-upload';
import { combineLatest } from 'rxjs';
import { filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { GameEvent } from '../../models/game-event';
import { DuelsInfo } from '../../models/memory/memory-duels';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { HsGameMetaData } from '../game-mode-data.service';
import { DungeonLootInfoUpdatedEvent } from '../mainwindow/store/events/duels/dungeon-loot-info-updated-event';
import { ReviewIdService } from '../review-id.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { DuelsRunIdService, findSignatureTreasure } from './duels-run-id.service';
import { DuelsStateBuilderService } from './duels-state-builder.service';
import { isDuels } from './duels-utils';

const DUNGEON_LOOT_INFO_URL = 'https://e4rso1a869.execute-api.us-west-2.amazonaws.com/Prod/{proxy+}';

@Injectable()
export class DuelsLootParserService {
	constructor(
		private gameEvents: GameEventsEmitterService,
		private allCards: CardsFacadeService,
		private ow: OverwolfService,
		private api: ApiRunner,
		private readonly duelsState: DuelsStateBuilderService,
		private readonly store: AppUiStoreFacadeService,
		private readonly reviewIdService: ReviewIdService,
		private readonly duelsRunIdService: DuelsRunIdService,
		private readonly events: Events,
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		// We have two requirements:
		// - process only one event per game (the event will be in charge of telling the server everything about the choices done
		// in the "tavern" phase)
		// - only send the info when it is "ready", i.e. the memory has been populated with the info we need
		const memoryReadyToEmit$ = this.duelsState.duelsInfo$$.pipe(
			filter((info) => !!info),
			tap((info) => console.debug('[duels-loot] memory info updated', info)),
			map((duelsInfo) => {
				const signatureTreasure = findSignatureTreasure(duelsInfo.DeckList, this.allCards);
				console.debug('[duels-loot] signatureTreasure from decklist', signatureTreasure, duelsInfo.DeckList);
				// It is important to only send the data once we have everything
				return !!signatureTreasure && (!!duelsInfo?.StartingHeroPower || !!duelsInfo?.StartingHeroPowerCardId);
			}),
			tap((info) => console.debug('[duels-loot] memory ready, we can emit the next event?', info)),
		);

		combineLatest([this.gameEvents.allEvents, memoryReadyToEmit$])
			.pipe(
				filter(([event, ready]) => !!ready),
				map(([event, ready]) => event),
				filter((event) => event.type === GameEvent.MATCH_METADATA && !event.additionalData.spectating),
				filter((event) => isDuels((event.additionalData.metaData as HsGameMetaData).GameType)),
				withLatestFrom(
					this.duelsState.duelsInfo$$,
					this.reviewIdService.reviewId$,
					this.duelsRunIdService.duelsRunId$,
				),
			)
			.subscribe(([event, duelsInfo, reviewId, duelsRunId]) => {
				this.sendLootInfo(event.additionalData.metaData, duelsInfo, reviewId, duelsRunId);
			});

		this.events
			.on(Events.REVIEW_FINALIZED)
			.pipe(
				map((event) => event.data[0].game as GameForUpload),
				filter((game) => isDuels(game.gameMode)),
			)
			.subscribe((game) => this.sendBasicLootInfo(game));
	}

	private async sendBasicLootInfo(game: GameForUpload) {
		const user = await this.ow.getCurrentUser();
		const replay = parseHsReplayString(game.uncompressedXmlReplay, this.allCards.getService());
		console.debug('[duels-loot] replay', replay.mainPlayerHeroPowerCardId, replay.opponentPlayerHeroPowerCardId);
		console.debug('[duels-loot] will decode deck', game.deckstring);
		let signatureTreasure: string = null;
		if (game.deckstring) {
			const deckCardDbfIds = decode(game.deckstring).cards.map((pair) => pair[0]);
			signatureTreasure = findSignatureTreasure(deckCardDbfIds, this.allCards);
		}

		const input: Input = {
			type: game.gameMode as 'duels' | 'paid-duels',
			reviewId: game.reviewId,
			runId: game.runId,
			userId: user.userId,
			userName: user.username,
			startingHeroPower: replay.mainPlayerHeroPowerCardId,
			signatureTreasure: signatureTreasure,
			lootBundles: null,
			chosenLootIndex: null,
			treasureOptions: null,
			chosenTreasureIndex: null,
			rewards: null,
			currentWins: null,
			currentLosses: null,
			rating: null,
			appVersion: process.env.APP_VERSION,
		};
		console.log('[duels-loot] sending basic loot into', input);
		this.api.callPostApi(DUNGEON_LOOT_INFO_URL, input);
		this.store.send(new DungeonLootInfoUpdatedEvent(input));
	}

	private async sendLootInfo(metaData: HsGameMetaData, duelsInfo: DuelsInfo, reviewId: string, duelsRunId: string) {
		console.log('[duels-loot] sending loot info', duelsInfo);
		if (duelsInfo?.Wins === 0 && duelsInfo?.Losses === 0) {
			// Doing it here and not a filter because we want to keep that information in the log file
			console.log('[duels-loot] not sending info in the first game, as data might be from the previous run');
			return;
		}

		const user = await this.ow.getCurrentUser();
		const treasures: readonly string[] = !!duelsInfo?.TreasureOption
			? duelsInfo.TreasureOption.map((option) => this.allCards.getCard(+option)?.id || '' + option)
			: [];
		const signatureTreasure: string = findSignatureTreasure(duelsInfo.DeckList, this.allCards);
		const input: Input = {
			type: metaData.GameType === GameType.GT_PVPDR ? 'duels' : 'paid-duels',
			reviewId: reviewId,
			runId: duelsRunId,
			userId: user.userId,
			userName: user.username,
			// Keep it in case the basic data has not been sent yet (typically during the transition phase)
			startingHeroPower:
				this.allCards.getCard(duelsInfo.StartingHeroPower ?? duelsInfo.StartingHeroPowerCardId)?.id ||
				'' + (duelsInfo.StartingHeroPower ?? duelsInfo.StartingHeroPowerCardId),
			signatureTreasure: signatureTreasure,
			lootBundles: duelsInfo.LootOptionBundles
				? duelsInfo.LootOptionBundles.filter((bundle) => bundle).map((bundle) => ({
						bundleId: this.allCards.getCardFromDbfId(+bundle.BundleId)?.id || '' + bundle.BundleId,
						elements: bundle.Elements.map(
							(dbfId) => this.allCards.getCardFromDbfId(+dbfId)?.id || '' + dbfId,
						),
				  }))
				: [],
			chosenLootIndex: duelsInfo.ChosenLoot,
			treasureOptions: treasures,
			chosenTreasureIndex: duelsInfo.ChosenTreasure,
			rewards: null,
			currentWins: duelsInfo.Wins,
			currentLosses: duelsInfo.Losses,
			rating: metaData.GameType === GameType.GT_PVPDR ? duelsInfo?.Rating : duelsInfo?.PaidRating,
			appVersion: process.env.APP_VERSION,
		};
		console.log('[run-info] sending loot into', input);
		this.api.callPostApi(DUNGEON_LOOT_INFO_URL, input);
		this.store.send(new DungeonLootInfoUpdatedEvent(input));
	}
}
