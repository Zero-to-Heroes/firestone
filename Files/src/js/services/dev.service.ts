import { Injectable } from '@angular/core';
import { AchievementsMonitor } from './achievement/achievements-monitor.service';
import { Achievement } from '../models/achievement';
import { AchievementsStorageService } from './achievement/achievements-storage.service';
import { CompletedAchievement } from '../models/completed-achievement';
import { PackMonitor } from './collection/pack-monitor.service';
import { Card } from '../models/card';
import { SimpleIOService } from './plugins/simple-io.service';
import { GameEventsPluginService } from './plugins/game-events-plugin.service';
import { DeckParserService } from './decktracker/deck-parser.service';
import { GameStateService } from './decktracker/game-state.service';
import { GameState } from '../models/decktracker/game-state';
import { GameEvents } from './game-events.service';

const HEARTHSTONE_GAME_ID = 9898;

declare var overwolf: any;

@Injectable()
export class DevService {

	constructor(
		private achievementMonitor: AchievementsMonitor, 
		private packMonitor: PackMonitor,
		private io: SimpleIOService,
		private gameEvents: GameEvents,
		private gameEventsPlugin: GameEventsPluginService,
		private deckService: DeckParserService,
		private storage: AchievementsStorageService) {
		this.addTestCommands();
	}

	private addTestCommands() {
		this.addCollectionCommands();
		this.addAchievementCommands();
		this.addCustomLogLoaderCommand();
	}

	private addAchievementCommands() {
		const achievement = new Achievement(
			'dungeon_run_boss_encounter_LOOTA_BOSS_44h',
			'Fake Wee Whelp',
			'Temp text',
			'dungeon_run_boss_encounter',
			'LOOTA_BOSS_44h',
			'minion',
			null,
			null,
			'common',
			1,
			[]
		)
		window['showAchievementNotification'] = () => {			
			this.achievementMonitor.sendPreRecordNotification(achievement, 20000);
			setTimeout(() => this.achievementMonitor.sendPostRecordNotification(achievement), 500);
		}
		window['addReplayInfos'] = async () => {
			const achievements = await this.storage.loadAchievements();
			const achievement = achievements
					.filter((ach) => ach.replayInfo && ach.replayInfo.length > 0)
					[0];
			const newReplays = [
				...achievement.replayInfo, 
				achievement.replayInfo[0],
				achievement.replayInfo[0],
				achievement.replayInfo[0],
				achievement.replayInfo[0],
				achievement.replayInfo[0],
				achievement.replayInfo[0],
			];
			const newAchievement = new CompletedAchievement(
				achievement.id,
				achievement.numberOfCompletions,
				newReplays
			);
			const updated = await this.storage.saveAchievement(newAchievement);
			console.log('added lots of replays to achievement', updated.id, updated);
		}
	}

	private addCollectionCommands() {	
		window['showCardNotification'] = () => {
			const card: Card = new Card('AT_001', 1, 1);
			this.packMonitor.createNewCardToast(card, 'GOLDEN');
		}
	}

	private addCustomLogLoaderCommand() {	
		window['loadLog'] = (logName, deckString) => {
			this.deckService.currentDeck.deckstring = deckString;
			this.deckService.decodeDeckString();
			overwolf.games.getRunningGameInfo(async (res: any) => {
				if (res && res.isRunning && res.id && Math.floor(res.id / 10) === HEARTHSTONE_GAME_ID) {
					const logsLocation = res.executionPath.split('Hearthstone.exe')[0] + 'Logs\\' + logName;
					const logContents = await this.io.getFileContents(logsLocation);
					this.loadArbitraryLogContent(logContents);
				}
			});
		}
	}

	private async loadArbitraryLogContent(content: string) {
		const plugin = await this.gameEventsPlugin.get();
		plugin.initRealtimeLogConversion(() => {
			plugin.startDevMode();
			const logLines = content.split('\n');
			plugin.realtimeLogProcessing(logLines, () => {
				console.log('Jobs done');
				plugin.stopDevMode();
				this.deckService.reset();
			});
		});
	}
}
