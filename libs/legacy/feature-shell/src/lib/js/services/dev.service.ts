import { Injectable } from '@angular/core';
import { decode, encode } from '@firestone-hs/deckstrings';
import { SceneMode } from '@firestone-hs/reference-data';
import { DeckCard, DeckHandlerService, DeckState, GameState } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { sortByProperties } from '@services/utils';
import { CollectionCardType } from '../models/collection/collection-card-type.type';
import { CardNotificationsService } from './collection/card-notifications.service';
import { DeckManipulationHelper } from './decktracker/event-parser/deck-manipulation-helper';
import { GameStateService } from './decktracker/game-state.service';
import { GameEventsEmitterService } from './game-events-emitter.service';
import { GameEvents } from './game-events.service';
// const HEARTHSTONE_GAME_ID = 9898;

// declare var overwolf: any;

@Injectable()
export class DevService {
	constructor(
		private events: GameEventsEmitterService,
		private ow: OverwolfService,
		private gameEvents: GameEvents,
		private gameState: GameStateService,
		private helper: DeckManipulationHelper,
		private handler: DeckHandlerService,
		private allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly cardNotification: CardNotificationsService,
		private readonly scene: SceneService,
	) {
		if (process.env.NODE_ENV === 'production') {
			return;
		}
		this.addTestCommands();
	}

	private addTestCommands() {
		window['clearDeckVersions'] = async () => {
			const prefs = await this.prefs.getPreferences();
			await this.prefs.savePreferences({ ...prefs, constructedDeckVersions: [] });
		};
		this.addAchievementCommands();
	}

	private addAchievementCommands() {
		window['showCardNotification'] = (
			cardId = 'GVG_118',
			isSecondCopy = false,
			type: CollectionCardType = 'GOLDEN',
		) => {
			this.cardNotification.createNewCardToast(cardId, isSecondCopy, type);
		};

		window['fakeGame'] = async () => {
			const events = [];
			const sub = this.events.allEvents.subscribe((event) => events.push(event.type));
			this.scene.currentScene$$.next(SceneMode.GAMEPLAY);
			const logsLocation = `E:\\Source\\zerotoheroes\\firestone\\test-tools\\game.log`;
			const logContents = await this.ow.readTextFile(logsLocation);
			const logLines = logContents.split('\n');
			console.log('logLines', logLines?.length);
			await sleep(2000);
			let currentIndex = 0;
			for (const line of logLines) {
				this.gameEvents.receiveLogLine(line);
				currentIndex++;
				if (currentIndex % 4000 === 0) {
					console.log('[game-events] processed', currentIndex, 'lines out of', logLines.length);
					await sleep(500);
				}
			}
			sub.unsubscribe();
			console.log('game-events', events.join(','));
			console.log('time spent in event dispatch: ', this.gameEvents.totalTime);
		};
		window['startDeckCycle'] = async (logName, repeats, deckString) => {
			console.debug('starting new deck cycle', logName, repeats, deckString);
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			console.debug = console.debug = (args) => {};
			const logsLocation = `E:\\Source\\zerotoheroes\\firestone\\integration-tests\\events\\${logName}.json`;
			const logContents = await this.ow.readTextFile(logsLocation);
			const events = JSON.parse(logContents);
			while (repeats > 0) {
				console.warn('starting iteration', repeats);
				await this.loadEvents(events, true, deckString);
				await sleep(10000);
				repeats--;
			}
			console.warn('iterations over');
			// window['startDeckCycle'](logName, deckString);
		};
		window['encodeDeck'] = (deckstring) => {
			console.debug(encode(deckstring));
		};
		window['decodeDeck'] = (deckstring) => {
			console.debug(decode(deckstring));
		};
		window['decodeDeckFull'] = (deckstring) => {
			const decoded = decode(deckstring);
			const result = decoded.cards
				.map(([cardDbfId, quantity]) => ({
					cardId: this.allCards.getCardFromDbfId(cardDbfId).id,
					name: this.allCards.getCardFromDbfId(cardDbfId).name,
					quantity: quantity,
					manaCost: this.allCards.getCardFromDbfId(cardDbfId).cost,
				}))
				.sort(sortByProperties((info) => [info.manaCost, info.name]));
			console.debug(result);
		};
		window['normalizeDeck'] = (deckstring: string) => {
			console.debug(this.allCards.normalizeDeckList(deckstring));
		};
	}

	private async loadEvents(events: any, awaitEvents: boolean, deckstring?: string, timeBetweenEvents?: number) {
		// return;

		for (const event of events) {
			if (event.Type === 'BATTLEGROUNDS_NEXT_OPPONENT') {
				await sleep(1000);
			}
			if (event.Type === 'BATTLEGROUNDS_PLAYER_BOARD') {
				await sleep(3000);
			}

			if (awaitEvents) {
				await this.gameEvents.dispatchGameEvent({ ...event });
				if (timeBetweenEvents) {
					await sleep(timeBetweenEvents);
				}
			} else {
				this.gameEvents.dispatchGameEvent({ ...event });
			}

			if (deckstring && event.Type === 'LOCAL_PLAYER') {
				await sleep(500);
				const decklist = this.handler.buildDeckList(deckstring);

				// And since this event usually arrives after the cards in hand were drawn, remove from the deck
				// whatever we can
				let newDeck = decklist;
				const currentState = this.gameState.state;
				const deck = currentState.playerDeck;
				for (const card of [...deck.hand, ...deck.otherZone, ...deck.board]) {
					newDeck = this.helper.removeSingleCardFromZone(newDeck, card.cardId, card.entityId)[0];
				}

				const newPlayerDeck = deck.update({
					deckstring: deckstring,
					deckList: decklist,
					deck: deckstring ? this.flagCards(newDeck) : newDeck,
					hand: deckstring ? this.flagCards(deck.hand) : deck.hand,
					otherZone: deckstring ? this.flagCards(deck.otherZone) : deck.otherZone,
				} as DeckState);
				console.debug('[opponent-player] newPlayerDeck', newPlayerDeck);
				this.gameState.state = currentState.update({
					playerDeck: newPlayerDeck,
				} as GameState);
				console.debug('updated decklist', this.gameState.state);
			}
		}
	}

	private addCustomLogLoaderCommand() {
		// window['loadLog'] = (logName, deckString) => {
		// 	if (deckString) {
		// 		this.deckService.currentDeck.deckstring = deckString;
		// 		this.deckService.decodeDeckString();
		// 	}
		// 	overwolf.games.getRunningGameInfo(async (res: any) => {
		// 		if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
		// 			const logsLocation = res.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + logName;
		// 			const logContents = await this.io.getFileContents(logsLocation);
		// 			this.loadArbitraryLogContent(logContents);
		// 		}
		// 	});
		// };
	}

	private flagCards(cards: readonly DeckCard[]): readonly DeckCard[] {
		return cards.map((card) =>
			card.update({
				inInitialDeck: true,
			} as DeckCard),
		);
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
