import { Injectable } from '@angular/core';
import { GameType } from '@firestone-hs/reference-data';
import { Input } from '@firestone-hs/save-dungeon-loot-info/dist/input';
import { CardsFacadeService } from '@services/cards-facade.service';
import { filter, withLatestFrom } from 'rxjs/operators';
import { GameEvent } from '../../models/game-event';
import { DuelsInfo } from '../../models/memory/memory-duels';
import { ApiRunner } from '../api-runner';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { HsGameMetaData } from '../game-mode-data.service';
import { DungeonLootInfoUpdatedEvent } from '../mainwindow/store/events/duels/dungeon-loot-info-updated-event';
import { OverwolfService } from '../overwolf.service';
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
	) {
		this.init();
	}

	private async init() {
		await this.store.initComplete();

		this.gameEvents.allEvents
			.pipe(
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
	}

	private async sendLootInfo(metaData: HsGameMetaData, duelsInfo: DuelsInfo, reviewId: string, duelsRunId: string) {
		console.log('[duels-loot] sending loot info', duelsInfo);
		if (duelsInfo?.Wins === 0 && duelsInfo?.Losses === 0) {
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
			startingHeroPower:
				this.allCards.getCard(duelsInfo.StartingHeroPower)?.id || '' + duelsInfo.StartingHeroPower,
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
