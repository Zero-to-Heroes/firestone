import { Injectable } from '@angular/core';
import { BgsCompAdvice } from '@firestone-hs/content-craetor-input';
import { decode, encode } from '@firestone-hs/deckstrings';
import { SceneMode } from '@firestone-hs/reference-data';
import { CollectionCardType } from '@firestone-hs/user-packs';
import { CompositionDetectorService, bgsSimLatency } from '@firestone/battlegrounds/core';
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
import { feedPowerLogLinesPaced } from '@firestone/power-log-parser';
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
				/**
				 * Pause every 2000 lines while feeding the log. Default 0 = just yield to the
				 * event loop so the processing queues can interleave (a 1M-line BG log used to
				 * accumulate ~4 min of pure sleep with the old 500ms default, dwarfing the
				 * actual parsing time in the reported total). Set >0 to simulate slow log
				 * arrival (e.g. real-time stats testing). Ignored when `realtime` is set.
				 */
				waitTime?: number;
				/**
				 * Feed lines following the log's own `D HH:MM:SS` timestamps, so the replay
				 * progresses at the pace of the original game (mirrors live batching /
				 * broadcast cadence far better than a fast feed). `true` = real time, a
				 * number = speed multiplier (2 = twice as fast).
				 */
				realtime?: boolean | number;
				/** Cap on idle gaps between lines in realtime mode, pre-speed ms (default 15000). */
				maxGapMs?: number;
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
			// Don't console.log the raw contents: dumping a 100MB+ string into devtools is slow
			// and skews the measured total.
			console.log('logContents length', logContents?.length, fileName);
			const start = Date.now();
			console.warn('starting to parse log', start);
			// Match power-log-replay-harness: CRLF-safe split + last game only (multi-match exports otherwise skew state).
			const logLines = logContents.split(/\r?\n/);
			console.log('logLines', logLines?.length, logLines.slice(0, 20));
			console.log('allowReconnects', allowReconnects);
			await sleep(2000);
			const feedStart = Date.now();
			const feedLine = (line: string) => {
				if (!allowReconnects && line.includes('tag=GAME_SEED')) {
					line = line.replace(/value=\d+/, `value=${Math.floor(Math.random() * 1000000)}`);
					console.log('replaced game seed', line);
				}
				this.gameEvents.receiveLogLine(line);
			};
			if (options?.realtime) {
				const speed = typeof options.realtime === 'number' ? options.realtime : 1;
				console.log('[fakeGame] realtime feed', { speed, maxGapMs: options?.maxGapMs ?? 15000 });
				await feedPowerLogLinesPaced(logLines, feedLine, {
					speed,
					maxGapMs: options?.maxGapMs,
					onProgress: (fed, total, elapsedMs) => {
						if (fed % 50_000 < 2000) {
							console.log('[fakeGame] realtime progress', fed, '/', total, elapsedMs, 'ms');
						}
					},
				});
			} else {
				let currentIndex = 0;
				for (const line of logLines) {
					feedLine(line);
					currentIndex++;
					if (currentIndex % 2000 === 0) {
						await sleep(options?.waitTime ?? 0);
					}
				}
			}
			const feedDone = Date.now();
			await this.gameEvents.awaitProcessingQueueIdle();
			const queueIdle = Date.now();
			await this.gameState.awaitQueueIdle();
			const gsIdle = Date.now();
			await sleep(options?.settleMs ?? 8000);
			sub.unsubscribe();
			console.log('game-events', events.join(','));
			console.log('time spent in event dispatch: ', this.gameEvents.totalTime);
			const timings = {
				lines: logLines.length,
				events: events.length,
				feedMs: feedDone - feedStart,
				gameEventsDrainMs: queueIdle - feedDone,
				gameStateDrainMs: gsIdle - queueIdle,
				eventDispatchMs: this.gameEvents.totalTime,
				totalMs: Date.now() - start,
			};
			console.warn('[fakeGame] timings', JSON.stringify(timings));
			// Returned (JSON-friendly) so remote tooling (CDP Runtime.evaluate with
			// awaitPromise) can benchmark the live app programmatically.
			return timings;
		};
		// --- Perf helpers for remote benchmarking (CDP) ---------------------------------
		window['gsPerfEnable'] = (enabled = true) => {
			this.gameState.setPerfTraceEnabled(enabled);
			return enabled;
		};
		window['gsPerfReset'] = () => {
			this.gameState.resetPerfStats();
			this.gameEvents.totalTime = 0;
			return true;
		};
		window['gsPerfStats'] = (top = 30) => {
			const stats = this.gameState.getPerfStats();
			const sorted = Object.entries(stats)
				.sort(([, a], [, b]) => b.totalMs - a.totalMs)
				.slice(0, top)
				.map(([bucket, v]) => ({ bucket, totalMs: Math.round(v.totalMs * 10) / 10, calls: v.calls }));
			return { buckets: sorted, eventDispatchMs: this.gameEvents.totalTime };
		};
		window['bgsSimLatencyReset'] = () => {
			bgsSimLatency.reset();
			return true;
		};
		window['bgsSimLatencyStats'] = () => {
			const stats = bgsSimLatency.getStats();
			console.warn('[bgs-sim-latency] stats', JSON.stringify(stats));
			return stats;
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
