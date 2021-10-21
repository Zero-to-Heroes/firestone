import { Injectable } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/reference-data';
import { decode, encode } from 'deckstrings';
import { Achievement } from '../models/achievement';
import { DeckCard } from '../models/decktracker/deck-card';
import { DeckState } from '../models/decktracker/deck-state';
import { GameState } from '../models/decktracker/game-state';
import { GameStat } from '../models/mainwindow/stats/game-stat';
import { GameStats } from '../models/mainwindow/stats/game-stats';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { Challenge } from './achievement/achievements/challenges/challenge';
import { ChallengeBuilderService } from './achievement/achievements/challenges/challenge-builder.service';
import { AchievementsLoaderService } from './achievement/data/achievements-loader.service';
import { SetsService } from './collection/sets-service.service';
import { DeckHandlerService } from './decktracker/deck-handler.service';
import { DeckParserService } from './decktracker/deck-parser.service';
import { DeckManipulationHelper } from './decktracker/event-parser/deck-manipulation-helper';
import { GameStateService } from './decktracker/game-state.service';
import { Events } from './events.service';
import { GameEvents } from './game-events.service';
import { MainWindowStoreService } from './mainwindow/store/main-window-store.service';
import { OverwolfService } from './overwolf.service';
import { MemoryInspectionService } from './plugins/memory-inspection.service';

// const HEARTHSTONE_GAME_ID = 9898;

// declare var overwolf: any;

@Injectable()
export class DevService {
	constructor(
		private events: Events,
		private ow: OverwolfService,
		private gameEvents: GameEvents,
		private deckParser: DeckParserService,
		private cards: SetsService,
		private gameState: GameStateService,
		private helper: DeckManipulationHelper,
		private store: MainWindowStoreService,
		private challengeBuilder: ChallengeBuilderService,
		private achievementLoader: AchievementsLoaderService,
		private achievementsMonitor: AchievementsMonitor,
		private memoryService: MemoryInspectionService,
		private handler: DeckHandlerService,
	) {
		if (process.env.NODE_ENV === 'production') {
			return;
		}
		this.addTestCommands();
	}

	private addTestCommands() {
		// window['addGame'] = () => {
		// 	const reviewId = 'gagaga' + uuid();
		// 	const game: GameForUpload = new GameForUpload();
		// 	game.gameMode = 'battlegrounds';
		// 	const player: Player = new Player();
		// 	player.hero = 'BG20_HERO_101';
		// 	game.player = player;
		// 	game.additionalResult = '2';
		// 	game.uncompressedXmlReplay = replayXml;
		// 	const info: ManastormInfo = {
		// 		type: 'new-review',
		// 		reviewId: reviewId,
		// 		replayUrl: `https://replays.firestoneapp.com/?reviewId=${reviewId}`,
		// 		game: game,
		// 	};
		// 	console.debug('sending', info);
		// 	this.events.broadcast(Events.REVIEW_FINALIZED, info);
		// };
		// this.addCollectionCommands();
		this.addAchievementCommands();
		// this.addCustomLogLoaderCommand();
		// window['arena'] = async () => {
		// 	const info = await this.memoryService.getArenaInfo();
		// 	console.debug(info);
		// };
		// window['matchStart'] = async () => {
		// 	this.gameEvents.dispatchGameEvent({
		// 		Type: 'BATTLEGROUNDS_HERO_SELECTION',
		// 		Value: {
		// 			CardIds: ['TB_BaconShop_HERO_58', 'TB_BaconShop_HERO_22', 'TB_BaconShop_HERO_56'],
		// 		},
		// 	});
		// };
	}

	private addAchievementCommands() {
		const achievement: Achievement = {
			id: 'dungeon_run_boss_encounter_LOOTA_BOSS_44h',
			name: 'Fake Wee Whelp',
			text: 'Temp text',
			type: 'dungeon_run_boss_encounter',
			displayCardId: 'LOOTA_BOSS_44h',
			displayCardType: 'minion',
			displayName: 'Boss met: Fake Wee Whelp',
			difficulty: 'common',
			icon: 'boss_encounter',
			maxNumberOfRecords: 1,
			points: 1,
			numberOfCompletions: 0,
			canBeCompletedOnlyOnce: false,
			replayInfo: [],
			root: null,
			priority: 0,
			emptyText: null,
			completedText: null,
		} as any;
		window['showAchievementNotification'] = () => {
			this.events.broadcast(Events.ACHIEVEMENT_COMPLETE, achievement, {
				notificationTimeout: () => 0,
				getRecordingDuration: () => 0,
			} as Challenge);
			// this.achievementMonitor.sendPreRecordNotification(achievement, 20000);
			// setTimeout(() => this.achievementMonitor.sendPostRecordNotification(achievement), 500);
		};
		window['showMatchStatsNotification'] = () => {
			this.events.broadcast(
				Events.GAME_STATS_UPDATED,
				Object.assign(new GameStats(), {
					stats: [
						Object.assign(new GameStat(), {
							reviewId: '5ddd7f7f3c4a7900013e16de',
							gameMode: 'battlegrounds',
							playerRank: '5123',
						} as GameStat),
					] as readonly GameStat[],
				} as GameStats),
			);
			// this.achievementMonitor.sendPreRecordNotification(achievement, 20000);
			// setTimeout(() => this.achievementMonitor.sendPostRecordNotification(achievement), 500);
		};
		window['loadEvents'] = async (
			fileName,
			awaitEvents = false,
			deckstring?: string,
			timeBetweenEvents?: number,
		) => {
			const logsLocation = `E:\\Source\\zerotoheroes\\firestone\\integration-tests\\events\\${fileName}.json`;
			let logContents = await this.ow.readTextFile(logsLocation);
			let events = JSON.parse(logContents);
			await this.loadEvents(events, awaitEvents, deckstring, timeBetweenEvents);
			logContents = null;
			events = null;
			console.debug('processing done');
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
		window['decodeDeck'] = (deckstring) => {
			console.debug(decode(deckstring));
		};
		window['buildDeck'] = async (decklist, hero) => {
			const cards = decklist.split('\n');
			console.debug(cards);
			const allCards = this.cards.getAllCards();
			const cardArray = cards
				.map((card) => {
					const [name, count] = card.split('#');
					const result: [readonly ReferenceCard[], number] = [
						allCards.filter((card) => card.id === name).length > 0
							? allCards.filter((card) => card.id === name)
							: allCards
									.filter((card) => card.name === name)
									.filter((card) => ['Battlegrounds', 'Wild_event'].indexOf(card.set) === -1)
									.filter((card) => !card.id.startsWith('FB_Champs'))
									.filter((card) => !card.id.startsWith('TB_'))
									.filter((card) => card.type !== 'Hero')
									.filter((card) => card.id.indexOf('o') === -1) // Don't include ???
									.filter((card) => card.id.indexOf('t') === -1) // Don't include tokens
									.filter((card) => card.id.indexOf('e') === -1), // Don't include enchantments
						count,
					];
					if (result[0].length !== 1) {
						console.warn('issue mapping card', card, result);
						throw new Error('done');
					}
					return result;
				})
				.map((cards) => {
					return [cards[0][0].dbfId, parseInt(cards[1] || 1)];
				});
			console.debug(cardArray);
			const deck = {
				cards: cardArray,
				heroes: [hero],
				format: 1,
			};
			const deckstring = encode(deck as any);
			console.debug(deckstring);
			console.debug(decode(deckstring));
		};
		window['grantAchievement'] = async (id) => {
			const challenges = await this.achievementLoader.getChallengeModules();
			const challenge = challenges.find((chal) => chal.achievementId === id);
			this.achievementsMonitor['sendUnlockEvent'](challenge);
		};
		// window['addReplayInfos'] = async () => {
		// 	const achievements = await this.storage.loadAchievements();
		// 	const achievement = achievements.filter(ach => ach.replayInfo && ach.replayInfo.length > 0)[0];
		// 	const newReplays = [
		// 		...achievement.replayInfo,
		// 		achievement.replayInfo[0],
		// 		achievement.replayInfo[0],
		// 		achievement.replayInfo[0],
		// 		achievement.replayInfo[0],
		// 		achievement.replayInfo[0],
		// 		achievement.replayInfo[0],
		// 	];
		// 	const newAchievement = new CompletedAchievement(achievement.id, achievement.numberOfCompletions, newReplays);
		// 	const updated = await this.storage.saveAchievement(newAchievement);
		// 	console.debug('added lots of replays to achievement', updated.id, updated);
		// };
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

	// private addCollectionCommands() {
	// 	window['showCardNotification'] = () => {
	// 		const card: Card = new Card('AT_001', 1, 1);
	// 		this.packMonitor.createNewCardToast(card, 'GOLDEN');
	// 	};
	// }

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

	// private async processLogLines(logLines) {
	// 	const plugin = await this.gameEventsPlugin.get();
	// 	return new Promise<void>(resolve => {
	// 		plugin.initRealtimeLogConversion(async () => {
	// 			plugin.startDevMode();
	// 			for (const data of logLines) {
	// 				await this.sendLogLine(data);
	// 			}
	// 			plugin.stopDevMode();
	// 			resolve();
	// 		});
	// 	});
	// }

	// private async sendLogLine(data: string) {
	// 	return new Promise<void>(resolve => {
	// 		setTimeout(() => {
	// 			this.gameEvents.receiveLogLine(data);
	// 			resolve();
	// 		}, 1);
	// 	});
	// }

	// private async loadArbitraryLogContent(content: string) {
	// 	const plugin = await this.gameEventsPlugin.get();
	// 	plugin.initRealtimeLogConversion(() => {
	// 		plugin.startDevMode();
	// 		const logLines = content.split('\n');
	// 		plugin.realtimeLogProcessing(logLines, () => {
	// 			console.debug('Jobs done');
	// 			plugin.stopDevMode();
	// 			this.deckService.reset();
	// 		});
	// 	});
	// }

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
