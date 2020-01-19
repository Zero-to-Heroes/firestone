import { Injectable } from '@angular/core';
import { ReferenceCard } from '@firestone-hs/replay-parser';
import { decode, encode } from 'deckstrings';
import { Achievement } from '../models/achievement';
import { GameStat } from '../models/mainwindow/stats/game-stat';
import { GameStats } from '../models/mainwindow/stats/game-stats';
import { AchievementsLocalStorageService } from './achievement/achievements-local-storage.service';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { AchievementsNotificationService } from './achievement/achievements-notification.service';
import { Challenge } from './achievement/achievements/challenges/challenge';
import { PackMonitor } from './collection/pack-monitor.service';
import { DeckParserService } from './decktracker/deck-parser.service';
import { Events } from './events.service';
import { GameEvents } from './game-events.service';
import { GameEventsPluginService } from './plugins/game-events-plugin.service';
import { SimpleIOService } from './plugins/simple-io.service';
import { SetsService } from './sets-service.service';

// const HEARTHSTONE_GAME_ID = 9898;

// declare var overwolf: any;

@Injectable()
export class DevService {
	constructor(
		private events: Events,
		private achievementMonitor: AchievementsMonitor,
		private achievementNotifications: AchievementsNotificationService,
		private packMonitor: PackMonitor,
		private io: SimpleIOService,
		private gameEvents: GameEvents,
		private gameEventsPlugin: GameEventsPluginService,
		private deckService: DeckParserService,
		private storage: AchievementsLocalStorageService,
		private cards: SetsService,
	) {
		if (process.env.NODE_ENV === 'production') {
			return;
		}
		this.cards.initializeCardsDb();
		this.addTestCommands();
	}

	private addTestCommands() {
		// this.addCollectionCommands();
		this.addAchievementCommands();
		// this.addCustomLogLoaderCommand();
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
			this.events.broadcast(Events.ACHIEVEMENT_RECORDING_STARTED, achievement, {
				notificationTimeout: () => {},
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
					],
				} as GameStats),
			);
			// this.achievementMonitor.sendPreRecordNotification(achievement, 20000);
			// setTimeout(() => this.achievementMonitor.sendPostRecordNotification(achievement), 500);
		};
		window['loadEvents'] = async (fileName, awaitEvents = false, timeBetweenEvents?: number) => {
			const logsLocation = `G:\\Source\\zerotoheroes\\firestone\\test\\events\\${fileName}.json`;
			const logContents = await this.io.getFileContents(logsLocation);
			const events = JSON.parse(logContents);
			// console.log('sending events', events);
			for (let event of events) {
				// console.log('dispatching', event);
				if (awaitEvents) {
					await this.gameEvents.dispatchGameEvent(event);
					if (timeBetweenEvents) {
						await sleep(timeBetweenEvents);
					}
				} else {
					this.gameEvents.dispatchGameEvent(event);
				}
			}
			console.log('processing done');
		};
		window['buildDeck'] = async (decklist, hero) => {
			const cards = decklist.split('\n');
			console.log(cards);
			const allCards = this.cards.getAllCards();
			const cardArray = cards
				.map(card => {
					const [name, count] = card.split('#');
					const result: [readonly ReferenceCard[], number] = [
						allCards.filter(card => card.id === name).length > 0
							? allCards.filter(card => card.id === name)
							: allCards
									.filter(card => card.name === name)
									.filter(card => ['Battlegrounds', 'Wild_event'].indexOf(card.set) === -1)
									.filter(card => !card.id.startsWith('FB_Champs'))
									.filter(card => !card.id.startsWith('TB_'))
									.filter(card => card.type !== 'Hero')
									.filter(card => card.id.indexOf('o') === -1) // Don't include ???
									.filter(card => card.id.indexOf('t') === -1) // Don't include tokens
									.filter(card => card.id.indexOf('e') === -1), // Don't include enchantments
						count,
					];
					if (result[0].length !== 1) {
						console.warn('issue mapping card', card, result);
						throw new Error('done');
					}
					return result;
				})
				.map(cards => {
					return [cards[0][0].dbfId, parseInt(cards[1] || 1)];
				});
			console.log(cardArray);
			const deck = {
				cards: cardArray,
				heroes: [hero],
				format: 1,
			};
			const deckstring = encode(deck as any);
			console.log(deckstring);
			console.log(decode(deckstring));
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
		// 	console.log('added lots of replays to achievement', updated.id, updated);
		// };
	}

	// private addCollectionCommands() {
	// 	window['showCardNotification'] = () => {
	// 		const card: Card = new Card('AT_001', 1, 1);
	// 		this.packMonitor.createNewCardToast(card, 'GOLDEN');
	// 	};
	// }

	// private addCustomLogLoaderCommand() {
	// 	window['loadLog'] = (logName, deckString) => {
	// 		if (deckString) {
	// 			this.deckService.currentDeck.deckstring = deckString;
	// 			this.deckService.decodeDeckString();
	// 		}
	// 		overwolf.games.getRunningGameInfo(async (res: any) => {
	// 			if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
	// 				const logsLocation = res.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + logName;
	// 				const logContents = await this.io.getFileContents(logsLocation);
	// 				this.loadArbitraryLogContent(logContents);
	// 			}
	// 		});
	// 	};
	// 	window['startDeckCycle'] = async (logName, deckString) => {
	// 		console.log('starting new deck cycle', logName, deckString);
	// 		this.deckService.currentDeck.deckstring = deckString;
	// 		this.deckService.decodeDeckString();
	// 		const logsLocation = `D:\\Games\\Hearthstone\\Logs\\${logName}`;
	// 		const logContents = await this.io.getFileContents(logsLocation);
	// 		const logLines = logContents.split('\n');
	// 		await this.processLogLines(logLines);
	// 		this.deckService.reset();
	// 		window['startDeckCycle'](logName, deckString);
	// 	};
	// }

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
	// 			console.log('Jobs done');
	// 			plugin.stopDevMode();
	// 			this.deckService.reset();
	// 		});
	// 	});
	// }
}

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
