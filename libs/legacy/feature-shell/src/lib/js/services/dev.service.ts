import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { decode, encode } from '@firestone-hs/deckstrings';
import { SceneMode } from '@firestone-hs/reference-data';
import { CollectionCardType } from '@firestone-hs/user-packs';
import { CompositionDetectorService } from '@firestone/battlegrounds/core';
import { BgsMetaCompositionStrategiesService } from '@firestone/battlegrounds/services';
import { CardNotificationsService } from '@firestone/collection/services';
import {
	DeckHandlerService,
	DeckManipulationHelper,
	DeckParserService,
	GameEvents,
	GameEventsEmitterService,
	GameStateService,
} from '@firestone/game-state';
import { SceneService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { decodeBgsFinalComp } from '@firestone/stats/services';
import { sortByProperties } from '@services/utils';

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
		private readonly deckParser: DeckParserService,
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

		window['fakeGame'] = async (
			fileName: string,
			options?: {
				isBg?: boolean;
				allowReconnects?: boolean;
				deckstring?: string;
				/** Pause every N lines while feeding the log (default 500ms). */
				waitTime?: number;
				/** After the last line: wait for the game-events queue + this delay so GameState catches up (default 8000, same as power-log-replay-harness). */
				settleMs?: number;
			},
		) => {
			const { isBg = false, allowReconnects = false, deckstring = null } = options || {};
			const events = [];
			// this.gameState.processedEvents = [];
			const sub = this.events.allEvents.subscribe((event) => events.push(event.type));
			// To trigger real-time stats
			if (isBg) {
				this.scene.currentScene$$.next(SceneMode.BACON);
			}
			if (!!deckstring) {
				this.deckParser.forcedDeckstring = deckstring;
			}
			this.scene.currentScene$$.next(SceneMode.GAMEPLAY);
			// Do it everytime to reset its memory
			// await this.gameEvents['initPlugin']();
			const logsLocation = `E:\\Source\\zerotoheroes\\firestone\\test-tools\\${fileName ?? 'game.log'}`;
			const logContents = await this.ow.readTextFile(logsLocation);
			console.log('logContents', logContents, fileName);
			// Match power-log-replay-harness: CRLF-safe split + last game only (multi-match exports otherwise skew state).
			const logLines = logContents.split(/\r?\n/);
			console.log('logLines', logLines?.length, logLines.slice(0, 20));
			console.log('allowReconnects', allowReconnects);
			await sleep(2000);
			let currentIndex = 0;
			for (let line of logLines) {
				if (!allowReconnects && line.includes('tag=GAME_SEED')) {
					line = line.replace(/value=\d+/, `value=${Math.floor(Math.random() * 1000000)}`);
					console.log('replaced game seed', line);
				}
				this.gameEvents.receiveLogLine(line);

				currentIndex++;
				if (currentIndex % 2000 === 0) {
					console.log('[game-events] processed', currentIndex, 'lines out of', logLines.length);
					await sleep(options?.waitTime ?? 500);
				}
			}
			await this.gameEvents.awaitProcessingQueueIdle();
			await sleep(options?.settleMs ?? 8000);
			sub.unsubscribe();
			console.log('game-events', events.join(','));
			console.log('time spent in event dispatch: ', this.gameEvents.totalTime);
		};
		window['processedEvents'] = () => {
			// console.log('processedEvents', this.gameState.processedEvents.join(','));
		};
		window['startDeckCycle'] = async (logName, repeats, deckString) => {
			console.debug('starting new deck cycle', logName, repeats, deckString);
			// eslint-disable-next-line @typescript-eslint/no-empty-function
			console.debug = console.debug = (args) => {};
			while (repeats == null || repeats > 0) {
				console.warn('starting iteration', repeats);
				await window['fakeGame']('power.log', { waitTime: 5000 });
				await sleep(10000);
				if (repeats != null) repeats--;
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

	private async bgCompTest(reviewId: string) {
		console.debug('[bgComp] test', reviewId);
		const review: GameStat = await this.api.callGetApi<any>(`${RETRIEVE_REVIEW_URL}/${reviewId}`);
		const finalComp = decodeBgsFinalComp(review.finalComp);
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
			'[bgComp] possible detected',
			finalComp.board.map((entity) => entity.cardID),
			detected,
		);
		const actualComp = this.compositionDetector.detectComposition(
			{
				board: finalComp.board.map((entity) => entity.cardID),
				hand: [],
			},
			refComps,
		);
		console.debug('[bgComp] actual comp', actualComp);
	}

	private async testAllBgsComps() {
		const location = `D:\\sources\\firestone\\firestone\\test-tools\\comps\\identification.json`;
		const rawContent = await this.ow.readTextFile(location);
		const content = JSON.parse(rawContent);

		const refComps: readonly BgsCompAdvice[] = content.refComps;
		const games: readonly { reviewId: string; expected: string | null }[] = content.games;

		for (const game of games) {
			const review: GameStat = await this.api.callGetApi<any>(`${RETRIEVE_REVIEW_URL}/${game.reviewId}`);
			const finalComp = decodeBgsFinalComp(review.finalComp);
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
					this.compositionDetector.getPossibleCompositions(
						{
							board: finalComp.board.map((entity) => entity.cardID),
							hand: [],
						},
						refComps,
						5,
						true,
					),
				);
				console.error(
					'❌ [bgComp] expected',
					game.expected,
					'detected',
					detected?.composition?.compId,
					game.reviewId,
				);
			} else {
				console.debug(
					'✅ [bgComp] expected',
					game.expected,
					'detected',
					detected?.composition?.compId,
					detected?.confidence,
				);
			}
		}
		console.log('[bgComp] Job done');
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
