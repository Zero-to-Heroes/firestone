import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { decode, encode } from '@firestone-hs/deckstrings';
import { SceneMode } from '@firestone-hs/reference-data';
import { BgsMetaCompositionStrategiesService } from '@firestone/battlegrounds/common';
import { CompositionDetectorService } from '@firestone/battlegrounds/core';
import { DeckCard, DeckHandlerService, DeckState, GameState } from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { sortByProperties } from '@services/utils';
import { CollectionCardType } from '../models/collection/collection-card-type.type';
import { CardNotificationsService } from './collection/card-notifications.service';
import { DeckManipulationHelper } from './decktracker/event-parser/deck-manipulation-helper';
import { GameStateService } from './decktracker/game-state.service';
import { GameEventsEmitterService } from './game-events-emitter.service';
import { GameEvents } from './game-events.service';

const RETRIEVE_REVIEW_URL = 'https://itkmxena7k2kkmkgpevc6skcie0tlwmk.lambda-url.us-west-2.on.aws/';

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
		private readonly api: ApiRunner,
		private readonly compositionDetector: CompositionDetectorService,
		private readonly strategies: BgsMetaCompositionStrategiesService,
	) {
		if (process.env.NODE_ENV === 'production') {
			return;
		}
		this.addTestCommands();
	}

	private addTestCommands() {
		window['showCardNotification'] = (
			cardId = 'GVG_118',
			isSecondCopy = false,
			type: CollectionCardType = 'GOLDEN',
		) => {
			this.cardNotification.createNewCardToast(cardId, isSecondCopy, type);
		};

		window['fakeGame'] = async (fileName: string, isBg = false, allowReconnects = false) => {
			const events = [];
			this.gameState.processedEvents = [];
			const sub = this.events.allEvents.subscribe((event) => events.push(event.type));
			// To trigger real-time stats
			if (isBg) {
				this.scene.currentScene$$.next(SceneMode.BACON);
			}
			this.scene.currentScene$$.next(SceneMode.GAMEPLAY);
			// Do it everytime to reset its memory
			await this.gameEvents['initPlugin']();
			const logsLocation = `E:\\Source\\zerotoheroes\\firestone\\test-tools\\${fileName ?? 'game.log'}`;
			const logContents = await this.ow.readTextFile(logsLocation);
			console.log('logContents', logContents, fileName);
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
		window['processedEvents'] = () => {
			console.log('processedEvents', this.gameState.processedEvents.join(','));
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
		window['bgComp'] = async (reviewId: string) => this.bgCompTest(reviewId);
		window['bgCompsAll'] = async () => this.testAllBgsComps();
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

	private flagCards(cards: readonly DeckCard[]): readonly DeckCard[] {
		return cards.map((card) =>
			card.update({
				inInitialDeck: true,
			} as DeckCard),
		);
	}

	private async bgCompTest(reviewId: string) {
		console.debug('[bgComp] test', reviewId);
		const review: GameStat = await this.api.callGetApi<any>(`${RETRIEVE_REVIEW_URL}/${reviewId}`);
		const finalComp = GameStat.decodeBgsFinalComp(review.finalComp);
		console.debug('[bgComp] final comp', finalComp, review);
		const refComps = await this.strategies.strategies$$.getValueWithInit();
		console.debug('[bgComp] ref comps', refComps);
		const detected = this.compositionDetector.getPossibleCompositions(
			{
				board: finalComp.board.map((entity) => entity.cardID),
				hand: [],
			},
			refComps,
		);
		console.debug(
			'[bgComp] detected',
			finalComp.board.map((entity) => entity.cardID),
			detected,
		);
	}

	private async testAllBgsComps() {
		const location = `E:\\Source\\zerotoheroes\\firestone\\test-tools\\comps\\identification.json`;
		const rawContent = await this.ow.readTextFile(location);
		const content = JSON.parse(rawContent);

		const refComps: readonly BgsCompAdvice[] = content.refComps;
		const games: readonly { reviewId: string; expected: string | null }[] = content.games;

		for (const game of games) {
			const review: GameStat = await this.api.callGetApi<any>(`${RETRIEVE_REVIEW_URL}/${game.reviewId}`);
			const finalComp = GameStat.decodeBgsFinalComp(review.finalComp);
			const detecteds = this.compositionDetector.getPossibleCompositions(
				{
					board: finalComp.board.map((entity) => entity.cardID),
					hand: [],
				},
				refComps,
			);
			const detected = detecteds[0];
			if (game.expected != detected?.composition?.compId) {
				console.debug('[bgComp] final comp', finalComp, review);
				console.debug('[bgComp] ref comps', refComps);
				console.debug(
					'[bgComp] detected',
					finalComp.board.map((entity) => entity.cardID),
					detected,
					detecteds,
				);
				console.error('❌ [bgComp] expected', game.expected, 'detected', detected.composition.compId);
			} else {
				console.debug(
					'✅ [bgComp] all good',
					game.expected,
					'detected',
					detected?.composition?.compId,
					detected?.confidence,
				);
			}
		}
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
