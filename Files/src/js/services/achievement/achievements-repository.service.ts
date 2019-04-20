import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { cloneDeep } from 'lodash'

import { default as allAchievements } from './achievements_list.json';

import { CompletedAchievement } from '../../models/completed-achievement';
import { Achievement } from '../../models/achievement';
import { AchievementSet } from '../../models/achievement-set';

import { Challenge } from './achievements/challenge';
import { BossEncounter } from './achievements/boss-encounter';
import { BossVictory } from './achievements/boss-victory';
import { DungeonRunBossSetProvider } from './achievement-sets/dungeon-run-boss';
import { AchievementsStorageService } from './achievements-storage.service';
import { SetProvider } from './achievement-sets/set-provider';
import { AllCardsService } from '../all-cards.service';
import { MonsterHuntBossSetProvider } from './achievement-sets/monster-hunt-boss.js';
import { Events } from '../events.service.js';
import { AchievementConfService } from './achievement-conf.service.js';
import { RumbleRunShrinePlaySetProvider } from './achievement-sets/rumble-shrine-play.js';
import { ShrinePlay } from './achievements/shrine-play.js';
import { RumbleRunProgressionSetProvider } from './achievement-sets/rumble-progression.js';
import { RumbleProgression } from './achievements/rumble-progression.js';
import { RumbleRunTeammatesSetProvider } from './achievement-sets/rumble-teammate.js';
import { RumbleTeammatePlay } from './achievements/rumble-teammate-play.js';
import { RumbleRunPassivesSetProvider } from './achievement-sets/rumble-passive.js';
import { RumblePassivePlay } from './achievements/rumble-passive-play.js';
import { DungeonRunTreasureSetProvider } from './achievement-sets/dungeon-run-treasure.js';
import { DungeonRunTreasurePlay } from './achievements/dungeon-run-treasure-play.js';
import { DungeonRunPassivesSetProvider } from './achievement-sets/dungeon-un-passive.js';
import { DungeonRunPassivePlay } from './achievements/dungeon-run-passive-play.js';
import { DungeonRunProgressionSetProvider } from './achievement-sets/dungeon-run-progression.js';
import { DungeonRunProgression } from './achievements/dungeon-run-progression.js';
import { MonsterHuntProgressionSetProvider } from './achievement-sets/monster-hunt-progression.js';
import { MonsterHuntProgression } from './achievements/monster-hunt-progression.js';
import { MonsterHuntTreasureSetProvider } from './achievement-sets/monster-hunt-treasure.js';
import { MonsterHuntPassivesSetProvider } from './achievement-sets/monster-hunt-passive.js';
import { MonsterHuntTreasurePlay } from './achievements/monster-hunttreasure-play.js';
import { MonsterHuntPassivePlay } from './achievements/monster-hunt-passive-play.js';
import { AchievementCategory } from '../../models/achievement-category.js';
import { ScenarioId } from '../../models/scenario-id.js';
import { KrippFirstInstallmentSetProvider } from './achievement-sets/kripp/kripp-first-installment.js';
import { KrippShirvallah } from './achievements/kripp/kripp-shirvallah.js';
import { KrippCrazyDecksSetProvider } from './achievement-sets/kripp/kripp-crazy-decks.js';
import { KrippSoloModeSetProvider } from './achievement-sets/kripp/kripp-solo-mode.js';
import { KrippAmazingPlaysSetProvider } from './achievement-sets/kripp/kripp-amazing-plays.js';
import { KrippPogo } from './achievements/kripp/kripp-pogo.js';
import { KrippTreants } from './achievements/kripp/kripp-treants.js';
import { DeckParserService } from '../decktracker/deck-parser.service.js';
import { KrippClassic } from './achievements/kripp/kripp-classic.js';
import { KrippGoblinBombs } from './achievements/kripp/kripp-goblin-bombs.js';
import { KrippFatigue } from './achievements/kripp/kripp-fatigue.js';
import { KrippArcaneMissiles } from './achievements/kripp/kripp-arcane-missiles.js';

@Injectable()
export class AchievementsRepository {

	public modulesLoaded = new BehaviorSubject<boolean>(false);
	public challengeModules: Challenge[] = [];

	private allAchievements: Achievement[] = [];
	private setProviders: SetProvider[] = [];
	private categories: AchievementCategory[] = [];

	constructor(
			private storage: AchievementsStorageService, 
			private cards: AllCardsService, 
			private conf: AchievementConfService,
			private deckParser: DeckParserService,
			private events: Events) {
		this.registerModules();
		this.modulesLoaded.next(true);
	}

	public getAllAchievements(): Achievement[] {
		return cloneDeep(this.allAchievements);
	}

	public async loadAggregatedAchievements(): Promise<AchievementSet[]> {
		const completedAchievements: CompletedAchievement[] = await this.storage.loadAchievements();
		const achievementSets: AchievementSet[] = this.setProviders
				.map((provider) => provider.provide(this.allAchievements, completedAchievements));
		return achievementSets;
	}

	public getCategories(): AchievementCategory[] {
		return this.categories;
	}

	private registerModules() {
		// Create challenges
		// console.log('achievemnt types', this.achievementTypes());
		this.achievementTypes().forEach((achievementType) => {
			this.createChallenge(achievementType.type, achievementType.challengeCreationFn);
		});
		// Initialize set providers
		const dungeonRunProgressionProvider = new DungeonRunProgressionSetProvider(this.cards, this.conf);
		const dungeonRunBossProvider = new DungeonRunBossSetProvider(this.cards, this.conf);
		const dungeonRunTreasureProvider = new DungeonRunTreasureSetProvider(this.cards, this.conf);
		const dungeonRunPassivesProvider = new DungeonRunPassivesSetProvider(this.cards, this.conf);
		const monsterHuntProgressProvider = new MonsterHuntProgressionSetProvider(this.cards, this.conf);
		const monsterHuntBossProvider = new MonsterHuntBossSetProvider(this.cards, this.conf);
		const monsterHuntTreasureProvider = new MonsterHuntTreasureSetProvider(this.cards, this.conf);
		const monsterHuntPassiveProvider = new MonsterHuntPassivesSetProvider(this.cards, this.conf);
		const rumbleRunProgressionProvider = new RumbleRunProgressionSetProvider(this.cards, this.conf);
		const rumbleRunShrinePlayProvider = new RumbleRunShrinePlaySetProvider(this.cards, this.conf);
		const rumbleRunTeammateProvider = new RumbleRunTeammatesSetProvider(this.cards, this.conf);
		const rumbleRunPassiveProvider = new RumbleRunPassivesSetProvider(this.cards, this.conf);

		const krippFirstInstallment = new KrippFirstInstallmentSetProvider(this.cards, this.conf);
		// const krippCrazyDecksProvider = new KrippCrazyDecksSetProvider(this.cards, this.conf);
		// const krippSoloModeProvider = new KrippSoloModeSetProvider(this.cards, this.conf);
		// const krippAmazingPlaysProvider = new KrippAmazingPlaysSetProvider(this.cards, this.conf);

		this.setProviders = [
			dungeonRunProgressionProvider,
			dungeonRunBossProvider,
			dungeonRunTreasureProvider,
			dungeonRunPassivesProvider,
			monsterHuntProgressProvider,
			monsterHuntBossProvider,
			monsterHuntTreasureProvider,
			monsterHuntPassiveProvider,
			rumbleRunProgressionProvider,
			rumbleRunShrinePlayProvider,
			rumbleRunTeammateProvider,
			rumbleRunPassiveProvider,
            krippFirstInstallment,
            // krippCrazyDecksProvider,
            // krippSoloModeProvider,
            // krippAmazingPlaysProvider,
		];
		const krippCategory = new AchievementCategory(
			'kripp',
			'Kripp',
			'kripp',
			[
				krippFirstInstallment.id,
				// krippCrazyDecksProvider.id,
				// krippSoloModeProvider.id,
				// krippAmazingPlaysProvider.id,
			]
		);
		this.categories = [
			new AchievementCategory(
				'dungeon_run',
				'Dungeon Run',
				'dungeon_run',
				[
					dungeonRunProgressionProvider.id,
					dungeonRunBossProvider.id,
					dungeonRunTreasureProvider.id,
					dungeonRunPassivesProvider.id,
				]
			),
			new AchievementCategory(
				'monster_hunt',
				'Monster Hunt',
				'monster_hunt',
				[
					monsterHuntProgressProvider.id,
					monsterHuntBossProvider.id,
					monsterHuntTreasureProvider.id,
					monsterHuntPassiveProvider.id,
				]
			),
			new AchievementCategory(
				'rumble_run',
				'Rumble Run',
				'rumble_run',
				[
					rumbleRunProgressionProvider.id,
					rumbleRunShrinePlayProvider.id,
					rumbleRunTeammateProvider.id,
					rumbleRunPassiveProvider.id,
				]
			),
			// krippCategory,
		]
		// Create all the achievements
		this.allAchievements = (<any>allAchievements)
			.map((achievement) => new Achievement(
				achievement.id, 
				achievement.name, 
				achievement.text,
				achievement.type, 
				achievement.bossId || achievement.cardId || (achievement.cardIds && achievement.cardIds[0]), 
				achievement.cardType,
				achievement.secondaryCardId,
				achievement.secodaryCardType,
				achievement.difficulty,
				0,
				[]));
		// Create the achievement sets
		this.loadAggregatedAchievements().then((result) => console.log('loaded aggregated achievements'));
		console.log('[achievements] modules registered');
	}

	private createChallenge(achievementType: string, challengeCreationFn: Function) {
		(<any>allAchievements)
			.filter((achievement) => achievement.type === achievementType)
			.map(achievement => challengeCreationFn(achievement))
			.map((challenge) => {
				this.challengeModules.push(challenge);
			});
	}

	private achievementTypes() {
		return [
			{ type: 'dungeon_run_progression', challengeCreationFn: (achievement) => new DungeonRunProgression(achievement, ScenarioId.DUNGEON_RUN, this.events) },
			{ type: 'dungeon_run_boss_encounter', challengeCreationFn: (achievement) => new BossEncounter(achievement, ScenarioId.DUNGEON_RUN, this.events) },
			{ type: 'dungeon_run_boss_victory', challengeCreationFn: (achievement) => new BossVictory(achievement, ScenarioId.DUNGEON_RUN, this.events) },
			{ type: 'dungeon_run_treasure_play', challengeCreationFn: (achievement) => new DungeonRunTreasurePlay(achievement, ScenarioId.DUNGEON_RUN, this.events) },
			{ type: 'dungeon_run_passive_play', challengeCreationFn: (achievement) => new DungeonRunPassivePlay(achievement, ScenarioId.DUNGEON_RUN, this.events) },
			{ type: 'monster_hunt_progression', challengeCreationFn: (achievement) => new MonsterHuntProgression(achievement, ScenarioId.MONSTER_HUNT, this.events) },
			{ type: 'monster_hunt_final_boss', challengeCreationFn: (achievement) => new BossVictory(achievement, ScenarioId.MONSTER_HUNT, this.events) },
			{ type: 'monster_hunt_boss_encounter', challengeCreationFn: (achievement) => new BossEncounter(achievement, ScenarioId.MONSTER_HUNT, this.events) },
			{ type: 'monster_hunt_boss_victory', challengeCreationFn: (achievement) => new BossVictory(achievement, ScenarioId.MONSTER_HUNT, this.events) },
			{ type: 'monster_hunt_treasure_play', challengeCreationFn: (achievement) => new MonsterHuntTreasurePlay(achievement, ScenarioId.MONSTER_HUNT, this.events) },
			{ type: 'monster_hunt_passive_play', challengeCreationFn: (achievement) => new MonsterHuntPassivePlay(achievement, ScenarioId.MONSTER_HUNT, this.events) },
			{ type: 'rumble_run_progression', challengeCreationFn: (achievement) => new RumbleProgression(achievement, ScenarioId.RUMBLE_RUN, this.events) },
			{ type: 'rumble_run_shrine_play', challengeCreationFn: (achievement) => new ShrinePlay(achievement, ScenarioId.RUMBLE_RUN, this.events) },
			{ type: 'rumble_run_teammate_play', challengeCreationFn: (achievement) => new RumbleTeammatePlay(achievement, ScenarioId.RUMBLE_RUN, this.events) },
			{ type: 'rumble_run_passive_play', challengeCreationFn: (achievement) => new RumblePassivePlay(achievement, ScenarioId.RUMBLE_RUN, this.events) },

			// { type: 'kripp_achievements_1_shirvallah', challengeCreationFn: (achievement) => new KrippShirvallah(achievement, this.events) },
			// { type: 'kripp_achievements_1_pogo_hopper', challengeCreationFn: (achievement) => new KrippPogo(achievement, this.events) },
			// { type: 'kripp_achievements_1_treants', challengeCreationFn: (achievement) => new KrippTreants(achievement, this.events) },
			// { type: 'kripp_achievements_1_classic', challengeCreationFn: (achievement) => new KrippClassic(achievement, this.events, this.deckParser, this.cards) },
			// { type: 'kripp_achievements_1_fatigue', challengeCreationFn: (achievement) => new KrippFatigue(achievement, this.events) },
			// { type: 'kripp_achievements_1_goblin_bombs', challengeCreationFn: (achievement) => new KrippGoblinBombs(achievement, this.events) },
			// { type: 'kripp_achievements_1_arcane_missiles', challengeCreationFn: (achievement) => new KrippArcaneMissiles(achievement, this.events) },
		];
	}
}