import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';

import { sortBy, cloneDeep } from 'lodash'

import { default as allAchievements } from './achievements_list.json';

import { CompletedAchievement } from '../../models/completed-achievement';
import { Achievement } from '../../models/achievement';
import { AchievementSet } from '../../models/achievement-set';

import { Challenge } from './achievements/challenge';
import { BossEncounter } from './achievements/boss-encounter';
import { BossVictory } from './achievements/boss-victory';
import { PassivePick } from './achievements/passive-pick';
import { TreasurePick } from './achievements/treasure-pick';

declare var parseCardsText;
// declare var allAchievements;

@Injectable()
export class AchievementsRepository {

	public modulesLoaded = new BehaviorSubject<boolean>(false);
	public challengeModules: Challenge[] = [];

	private achievementSets: AchievementSet[] = [];

	constructor() {
		this.registerModules();
		this.modulesLoaded.next(true);
	}

	private registerModules() {
		console.log('allAchievements', allAchievements);
		(<any>allAchievements)
				.filter(achievement => achievement.type == 'dungeon_run_boss_encounter')
				.map(achievement => [achievement, new BossEncounter(achievement)])
				.forEach(([achievement, challenge]) => {
					this.addToAchievementSet(achievement);
					this.challengeModules.push(challenge);
				});
		(<any>allAchievements)
				.filter(achievement => achievement.type == 'dungeon_run_boss_victory')
				.map(achievement => [achievement, new BossVictory(achievement)])
				.forEach(([achievement, challenge]) => {
					this.addToAchievementSet(achievement);
					this.challengeModules.push(challenge);
				});
		(<any>allAchievements)
				.filter(achievement => achievement.type == 'monster_hunt_boss_encounter')
				.map(achievement => [achievement, new BossEncounter(achievement)])
				.forEach(([achievement, challenge]) => {
					this.addToAchievementSet(achievement);
					this.challengeModules.push(challenge);
				});
		(<any>allAchievements)
				.filter(achievement => achievement.type == 'monster_hunt_boss_victory')
				.map(achievement => [achievement, new BossVictory(achievement)])
				.forEach(([achievement, challenge]) => {
					this.addToAchievementSet(achievement);
					this.challengeModules.push(challenge);
				});

		// for (let passiveIds of Data.ALL_PASSIVE_IDS) {
		// 	this.achievementModules.push(new PassivePick("passive_" + passiveIds[0], passiveIds[0], passiveIds[1]));
		// }
		// for (let treasureIds of Data.ALL_TREASURE_IDS) {
		// 	this.achievementModules.push(new TreasurePick("treasure_" + treasureIds[0], treasureIds[0], treasureIds[1]));
		// }
		console.log('[achievements] modules registered', this.challengeModules);
	}

	public getAchievementSets(): AchievementSet[] {
		console.log('retrieving achievements sets', this.achievementSets);
		return cloneDeep(this.achievementSets);
	}

	private addToAchievementSet(achievement: any) {
		let theSet: AchievementSet;
		for (const set of this.achievementSets) {
			if (set.id == achievement.type) {
				theSet = set;
				break;
			}
		}
		if (!theSet) {
			theSet = new AchievementSet(achievement.type, this.displayName(achievement.type));
			this.achievementSets.push(theSet);
		}
		const newAchievement = new Achievement();
		newAchievement.id = achievement.id;
		newAchievement.type = achievement.type;
		newAchievement.cardId = achievement.bossId;
		newAchievement.name = achievement.name;
		theSet.achievements.push(newAchievement);
	}

	displayName(achievementType: string) {
		switch (achievementType) {
			case 'dungeon_run_boss_encounter':
				return 'Dungeon Run - Boss Encounters';
			case 'dungeon_run_boss_victory':
				return 'Dungeon Run - Boss Victories';
			case 'monster_hunt_boss_encounter':
				return 'Monster Hunt - Boss Encounters';
			case 'monster_hunt_boss_victory':
				return 'Monster Hunt - Boss Victories';
			default:
				return achievementType;
		}
	}

	// public getAllAchievementSets(): AchievementSet[] {
	// 	let result: AchievementSet[] = [
	// 		new AchievementSet('boss_encounter'),
	// 		new AchievementSet('boss_victory'),
	// 		// new AchievementSet('passive'),
	// 		// new AchievementSet('treasure'),
	// 	];

	// 	this.challengeModules
	// 		.map((challenge) => challenge.achieve())
	// 		.forEach((achievement) => this.addAchievementToSet(achievement, result));

	// 	// result.forEach((set) => {
	// 	// 	set.achievements = sortBy(set.achievements, 'order', 'id');
	// 	// });

	// 	console.log('achievement sets', result);
	// 	return result;
	// }

	// private addAchievementToSet(achievement: Achievement, achievementSets: AchievementSet[]) {
	// 	let achievementSet = achievementSets.find((set) => set.id === achievement.setId);
	// 	achievementSet.achievements.push(achievement);
	// }
}

// class Data {
// 	// TODO: get the list looking for LOOTA_BOSS + type = Hero
// 	public static readonly ALL_BOSS_IDS = Data.buildBossIds();
// 	public static readonly ALL_PASSIVE_IDS = Data.buildPassiveIds();
// 	public static readonly ALL_TREASURE_IDS = Data.buildTreasureds();

// 	private static buildBossIds(): any[] {
// 		let allCards: any[] = parseCardsText.jsonDatabase;
// 		return allCards
// 			.filter((card) => card.type == 'Hero')
// 			.filter((card) => card.id)
// 			.filter((card) => card.dbfId)
// 			.filter((card) => card.id.indexOf('LOOTA_BOSS') != -1)
// 			// Remove Inara the Mage
// 			.filter((card) => !(/^(.*)\d$/.test(card.id)))
// 			.map((card) => [card.id, card.dbfId]);

// 	}

// 	private static buildPassiveIds(): any[] {
// 		return parseCardsText.jsonDatabase
// 			.filter((card) => card.set == 'Lootapalooza')
// 			.filter((card) => card.id)
// 			.filter((card) => card.dbfId)
// 			.filter((card) => card.text)
// 			.filter((card) => card.text.indexOf('Passive') != -1)
// 			.map((card) => [card.id, card.dbfId]);
// 	}

// 	private static buildTreasureds(): any[] {
// 		return [
// 			['LOOTA_819', 46422], // Archmage Staff
// 			['LOOTA_836', 47037], // Bag of Coins
// 			['LOOTA_839', 47040], // Scroll of Confusion
// 			['LOOTA_823', 46426], // Bag of Stuffing
// 			['LOOTA_812', 46416], // Boots of Haste
// 			['LOOTA_834', 47022], // Gloves of Mugging
// 			['LOOTA_842a', 47045], // Blade of Quel'Delar
// 			['LOOTA_842b', 47046], // Hilt of Quel'Delar
// 			['LOOTA_842', 47044], // Quel'Delar
// 			['LOOTA_826', 46436], // Portable Ice Wall
// 			['LOOTA_843', 47251], // THE CANDLE
// 			['LOOTA_805', 46412], // Amulet of Domination
// 			['LOOTA_835', 47036], // Greedy Pickaxe
// 			['LOOTA_837', 47038], // Horn of Cenarius
// 			['LOOTA_821', 46424], // Vorpal Dagger
// 			['LOOTA_827', 46437], // Embers of Ragnaros
// 			['LOOT_998k', 45727], // Golden Kobold
// 			['LOOTA_806', 46413], // Wand of Disintegration
// 			['LOOTA_840', 47041], // Wax Rager
// 			['LOOTA_838', 47039], // Dr. Boom's Boombox
// 			['LOOTA_830', 46922], // Shifting Hourglass
// 			['LOOTA_814', 46418], // Wish
// 			['LOOTA_822', 46425], // Rod of Roasting
// 		]
// 	}
// }
