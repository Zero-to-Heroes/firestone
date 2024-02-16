import { Injectable } from '@angular/core';
import { parseHsReplayString } from '@firestone-hs/hs-replay-xml-parser/dist/public-api';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { DuelsInfo } from '@firestone/memory';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameForUpload } from '@firestone/stats/common';
import { Events } from '@legacy-import/src/lib/js/services/events.service';
import { distinctUntilChanged, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { DungeonLootInfoUpdatedEvent } from '../mainwindow/store/events/duels/dungeon-loot-info-updated-event';
import { ReviewIdService } from '../review-id.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';
import { deepEqual } from '../utils';
import { DuelsStateBuilderService } from './duels-state-builder.service';
import { isDuels } from './duels-utils';

export const DUNGEON_LOOT_INFO_URL = 'https://elaqmb2ux5gu46li2n44t3wfje0quytn.lambda-url.us-west-2.on.aws/';

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
		const validDuelsInfo$ = this.duelsState.duelsInfo$$.pipe(
			filter(
				(info) =>
					!!info?.DeckId &&
					!!info.HeroCardDbfId &&
					!!info.HeroPowerCardDbfId &&
					!!info.SignatureTreasureCardDbfId &&
					info.Wins != null &&
					info.Losses != null,
			),
		);
		// ISSUE: if we leave after choosing a loot / treasure, and go back (eg quit the app and restart it),
		// the info will be sent twice
		// Loots
		validDuelsInfo$
			.pipe(
				// tap((info) => console.debug('[duels-loot] will consider new loot info?', info)),
				filter((info) => info.ChosenLoot > 0 && info.LootOptionBundles?.length > 0),
				distinctUntilChanged((a, b) => {
					// console.debug('[duels-loot] comparing loot info', a, b);
					return a.ChosenLoot === b.ChosenLoot && deepEqual(a.LootOptionBundles, b.LootOptionBundles);
				}),
				tap((info) => console.debug('[duels-loot] new loot info', info)),
				withLatestFrom(this.reviewIdService.reviewId$),
			)
			.subscribe(([duelsInfo, reviewId]) => this.sendLootInfo(duelsInfo, reviewId, duelsInfo.DeckId));
		// Treasures
		validDuelsInfo$
			.pipe(
				filter((info) => info.ChosenTreasure > 0 && info.TreasureOption?.length > 0),
				distinctUntilChanged(
					(a, b) => a.ChosenTreasure === b.ChosenTreasure && deepEqual(a.TreasureOption, b.TreasureOption),
				),
				tap((info) => console.debug('[duels-loot] new treasure info', info)),
				withLatestFrom(this.reviewIdService.reviewId$),
			)
			.subscribe(([duelsInfo, reviewId]) => this.sendTreasureInfo(duelsInfo, reviewId, duelsInfo.DeckId));

		this.events
			.on(Events.REVIEW_FINALIZED)
			.pipe(
				map((event) => event.data[0].game as GameForUpload),
				filter((game) => isDuels(game.gameMode)),
				withLatestFrom(this.duelsState.duelsInfo$$),
			)
			.subscribe(([game, duelsInfo]) => this.sendBasicLootInfo(game, duelsInfo));
	}

	private async sendBasicLootInfo(game: GameForUpload, duelsInfo: DuelsInfo) {
		if (!duelsInfo) {
			console.warn('[duels-loot] no duels info, not sending basic loot info', game, duelsInfo);
			return;
		}

		const user = await this.ow.getCurrentUser();
		const replay = parseHsReplayString(game.uncompressedXmlReplay, this.allCards.getService());
		console.debug('[duels-loot] replay', replay.mainPlayerHeroPowerCardId, replay.opponentPlayerHeroPowerCardId);
		console.debug('[duels-loot] will decode deck', game.deckstring);
		const signatureTreasure: string = this.allCards.getCard(duelsInfo.SignatureTreasureCardDbfId).id;
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

	private async sendLootInfo(duelsInfo: DuelsInfo, reviewId: string, duelsRunId: string) {
		const lootBundles = duelsInfo.LootOptionBundles.filter((bundle) => bundle).map((bundle) => ({
			bundleId: this.allCards.getCardFromDbfId(+bundle.BundleId)?.id || '' + bundle.BundleId,
			elements: bundle.Elements.map((dbfId) => this.allCards.getCardFromDbfId(+dbfId)?.id || '' + dbfId),
		}));
		const chosenLootIndex = duelsInfo.ChosenLoot;
		const baseInput = await this.buildBaseInput(duelsInfo, reviewId, duelsRunId);
		const input: Input = {
			...baseInput,
			lootBundles: lootBundles,
			chosenLootIndex: chosenLootIndex, // Careful: this is 1-based, and not 0-based
		} as Input;
		console.log('[duels-loot] sending loot into', input);
		const result = await this.api.callPostApi(DUNGEON_LOOT_INFO_URL, input);
		// TODO: If we send duplicate info, don't send another event
		// if () {
		this.store.send(new DungeonLootInfoUpdatedEvent(input));
		// }
	}

	private async sendTreasureInfo(duelsInfo: DuelsInfo, reviewId: string, duelsRunId: string) {
		const treasures: readonly string[] = duelsInfo.TreasureOption.map(
			(option) => this.allCards.getCard(+option)?.id || '' + option,
		);
		const chosenTreasureIndex = duelsInfo.ChosenTreasure;
		const baseInput = await this.buildBaseInput(duelsInfo, reviewId, duelsRunId);
		const input: Input = {
			...baseInput,
			treasureOptions: treasures,
			chosenTreasureIndex: chosenTreasureIndex, // Careful: this is 1-based, and not 0-based
		} as Input;
		console.log('[duels-loot] sending treasure into', input);
		const result = await this.api.callPostApi(DUNGEON_LOOT_INFO_URL, input);
		// if () {

		this.store.send(new DungeonLootInfoUpdatedEvent(input));
		// }
	}

	private async buildBaseInput(duelsInfo: DuelsInfo, reviewId: string, duelsRunId: string): Promise<Partial<Input>> {
		const user = await this.ow.getCurrentUser();
		const type = duelsInfo?.IsPaidEntry ? 'paid-duels' : 'duels';
		const input: Partial<Input> = {
			type: type,
			reviewId: reviewId,
			runId: duelsRunId,
			userId: user.userId,
			userName: user.username,
			startingHeroPower: this.allCards.getCard(duelsInfo.HeroPowerCardDbfId)?.id,
			signatureTreasure: this.allCards.getCard(duelsInfo.SignatureTreasureCardDbfId).id,
			rewards: null,
			currentWins: duelsInfo.Wins,
			currentLosses: duelsInfo.Losses,
			rating: type === 'duels' ? duelsInfo?.Rating : duelsInfo?.PaidRating,
			appVersion: process.env.APP_VERSION,
		};
		return input;
	}
}
