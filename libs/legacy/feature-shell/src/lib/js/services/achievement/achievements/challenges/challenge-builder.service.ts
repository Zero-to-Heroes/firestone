import { Injectable } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { RawAchievement } from '../../../../models/achievement/raw-achievement';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { MemoryInspectionService } from '../../../plugins/memory-inspection.service';
import { ArmorAtEndReq } from '../requirements/armor-at-end-req';
import { BattlegroundsHeroSelectedReq } from '../requirements/battlegrounds-hero-selected-req';
import { BattlegroundsFinishReq } from '../requirements/battlegrounds/battlegrounds-finish-req';
import { BattlegroundsRankReq } from '../requirements/battlegrounds/battlegrounds-rank-req';
import { BattlegroundsTriplePlayReq } from '../requirements/battlegrounds/battlegrounds-tipple-play--req';
import { BoardFullOfSameLegendaryMinionReq } from '../requirements/board-full-of-same-legendary-minion-req';
import { CardDrawnOrReceivedInHandReq } from '../requirements/card-drawn-or-received-in-hand-req';
import { CardNotPlayedReq } from '../requirements/card-not-played-req';
import { CardPlayedOrChangedOnBoardReq } from '../requirements/card-played-or-changed-on-board-req';
import { CardPlayedOrOnBoardAtGameStartReq } from '../requirements/card-played-or-on-board-at-game-start-req';
import { CardWithSameAttributePlayedReq } from '../requirements/card-with-same-attribute-played-req';
import { CorrectOpponentReq } from '../requirements/correct-opponent-req';
import { CorrectStartingHealthReq } from '../requirements/correct-starting-health-req';
import { DamageAtEndReq } from '../requirements/damage-at-end-req';
import { DeathrattleTriggeredReq } from '../requirements/deathrattle-triggered-req';
import { DeckbuildingCardAttributeReq } from '../requirements/deckbuilding/deckbuilding-card-attribute-req';
import { DeckbuildingCardNameReq } from '../requirements/deckbuilding/deckbuilding-card-name-req';
import { DeckbuildingClassicReq } from '../requirements/deckbuilding/deckbuilding-classic-req';
import { DeckbuildingCostReq } from '../requirements/deckbuilding/deckbuilding-cost-req';
import { DeckbuildingMechanicReq } from '../requirements/deckbuilding/deckbuilding-mechanic-req';
import { DeckbuildingNoCardWithLetterInNameReq } from '../requirements/deckbuilding/deckbuilding-no-card-with-letter-in-name-req';
import { DeckbuildingNumberOfMinionsReq } from '../requirements/deckbuilding/deckbuilding-number-of-minions-req';
import { DeckbuildingRarityReq } from '../requirements/deckbuilding/deckbuilding-rarity-req';
import { DeckbuildingTextNumberOfWordsReq } from '../requirements/deckbuilding/deckbuilding-text-number-of-words-req';
import { DeckbuildingTextReq } from '../requirements/deckbuilding/deckbuilding-text-req';
import { DeckbuildingTypeReq } from '../requirements/deckbuilding/deckbuilding-type-req';
import { DungeonRunStepReq } from '../requirements/dungeon-run-step-req';
import { ExcludedScenarioIdReq } from '../requirements/excluded-scenario-id-req';
import { FatigueDamageReq } from '../requirements/fatigue-damage-req';
import { FormatTypeReq } from '../requirements/format-type-req';
import { GameMaxTurnsReq } from '../requirements/game-max-turns-req';
import { GameMinTurnsReq } from '../requirements/game-min-turns-req';
import { GameTieReq } from '../requirements/game-tie-req';
import { GameTypeReq } from '../requirements/game-type-req';
import { GameWonReq } from '../requirements/game-won-req';
import { GlobalStatReq } from '../requirements/globalstats/global-stat-req';
import { HealthAtEndReq } from '../requirements/health-at-end-req';
import { LastDamageDoneByMinionReq } from '../requirements/last-damage-done-by-minion-req';
import { MinionAttackReq } from '../requirements/minion-attack-req';
import { MinionSummonedReq } from '../requirements/minion-summoned-req';
import { MinionsControlledDuringTurnReq } from '../requirements/minions-controlled-during-turn-req';
import { MonsterHuntStepReq } from '../requirements/monster-hunt-step-req';
import { MulliganDoneReq } from '../requirements/mulligan-done-req';
import { PassiveBuffReq } from '../requirements/passive-buff-req';
import { PlayerClassReq } from '../requirements/player-class-req';
import { PlayerHeroReq } from '../requirements/player-hero-req';
import { ResummonRecurringVillainRew } from '../requirements/resummon-recurring-villain-req';
import { RumbleRunStepReq } from '../requirements/rumble-run-step-req';
import { SameMinionAttackReq } from '../requirements/same-minion-attack-req';
import { ScenarioIdReq } from '../requirements/scenario-id-req';
import { SceneChangedToGameReq } from '../requirements/scene-changed-to-game-req';
import { SecretTriggeredReq } from '../requirements/secret-triggered-req';
import { StandardRankedMinLeagueReq } from '../requirements/standard-ranked-min-rank-req';
import { TotalArmorGainReq } from '../requirements/total-armor-gain-req';
import { TotalCardsPlayedReq } from '../requirements/total-cards-played-req';
import { TotalDamageDealtReq } from '../requirements/total-damage-dealt-req';
import { TotalDamageTakenReq } from '../requirements/total-damage-taken-req';
import { TotalDiscardedCardsReq } from '../requirements/total-discarded-cards-req';
import { TotalHeroHealReq } from '../requirements/total-hero-heal-req';
import { TotalMinionsSummonedReq } from '../requirements/total-minions-summoned-req';
import { WinAgsinstClassInRankedStandardInLimitedTimeReq } from '../requirements/win-against-class-in-ranked-standard-in-limited-time-req';
import { WinStreakReq } from '../requirements/win-streak-req';
import { Requirement } from '../requirements/_requirement';
import { Challenge } from './challenge';
import { GenericChallenge } from './generic-challenge';

@Injectable()
export class ChallengeBuilderService {
	constructor(
		private readonly cards: CardsFacadeService,
		private readonly memoryInspection: MemoryInspectionService,
	) {}

	public buildChallenge(raw: RawAchievement): Challenge {
		// The case for the HS achievements, which are not computed by Firestone
		if (!raw?.requirements) {
			return null;
		}
		const requirements: readonly Requirement[] = this.buildRequirements(raw.requirements);
		return new GenericChallenge(raw.id, raw.resetEvents, requirements);
	}

	private buildRequirements(rawReqs: readonly RawRequirement[]): readonly Requirement[] {
		return rawReqs.map((rawReq) => {
			const req = this.buildRequirement(rawReq);
			req['rawReq'] = rawReq; // We use this when logging errors
			return req;
		});
	}

	private buildRequirement(rawReq: RawRequirement): Requirement {
		// prettier-ignore
		switch (rawReq.type) {
			case 'DUNGEON_RUN_STEP': return DungeonRunStepReq.create(rawReq);
			case 'MONSTER_HUNT_STEP': return MonsterHuntStepReq.create(rawReq);
			case 'RUMBLE_RUN_STEP': return RumbleRunStepReq.create(rawReq);
			case 'GAME_TYPE': return GameTypeReq.create(rawReq);
			case 'RANKED_MIN_LEAGUE': return StandardRankedMinLeagueReq.create(rawReq);
			case 'RANKED_FORMAT_TYPE': return FormatTypeReq.create(rawReq);
			case 'SCENARIO_IDS': return ScenarioIdReq.create(rawReq);
			case 'EXCLUDED_SCENARIO_IDS': return ExcludedScenarioIdReq.create(rawReq);
			case 'MULLIGAN_DONE': return MulliganDoneReq.create(rawReq);
			case 'GAME_WON': return GameWonReq.create(rawReq);
			case 'GAME_TIE': return GameTieReq.create(rawReq);
			case 'GAME_MIN_TURNS': return GameMinTurnsReq.create(rawReq);
			case 'GAME_MAX_TURN': // deprecated, there for backward-compatibilty
			case 'GAME_MAX_TURNS': 
				return GameMaxTurnsReq.create(rawReq);
			case 'PLAYER_HERO': return PlayerHeroReq.create(rawReq);
			case 'PLAYER_CLASS': return PlayerClassReq.create(rawReq, this.cards);
			case 'CORRECT_OPPONENT': return CorrectOpponentReq.create(rawReq);
			case 'CORRECT_STARTING_HEALTH': return CorrectStartingHealthReq.create(rawReq);
			case 'SCENE_CHANGED_TO_GAME': return SceneChangedToGameReq.create(rawReq);
			case 'CARD_PLAYED_OR_CHANGED_ON_BOARD': return CardPlayedOrChangedOnBoardReq.create(rawReq);
			case 'BATTLEGROUNDS_HERO_SELECTED': return BattlegroundsHeroSelectedReq.create(rawReq);
			case 'CARD_PLAYED_OR_ON_BOARD_AT_GAME_START': return CardPlayedOrOnBoardAtGameStartReq.create(rawReq);
			case 'CARD_NOT_PLAYED': return CardNotPlayedReq.create(rawReq);
			case 'CARD_DRAWN_OR_RECEIVED_IN_HAND': return CardDrawnOrReceivedInHandReq.create(rawReq);
			case 'MINION_SUMMONED': return MinionSummonedReq.create(rawReq);
			case 'SECRET_TRIGGERED': return SecretTriggeredReq.create(rawReq);
			case 'DEATHRATTLE_TRIGGERED': 
				console.debug(''); // No idea why I have to add this for jest to pick up the line
				return DeathrattleTriggeredReq.create(rawReq);
			case 'PASSIVE_BUFF': return PassiveBuffReq.create(rawReq);
			case 'MINION_ATTACK_ON_BOARD': return MinionAttackReq.create(rawReq);
			case 'HEALTH_AT_END': return HealthAtEndReq.create(rawReq);
			case 'DAMAGE_AT_END': return DamageAtEndReq.create(rawReq);
			case 'FATIGUE_DAMAGE': return FatigueDamageReq.create(rawReq);
			case 'ARMOR_AT_END': return ArmorAtEndReq.create(rawReq);
			case 'TOTAL_DAMAGE_TAKEN': return TotalDamageTakenReq.create(rawReq);
			case 'TOTAL_HERO_HEAL': return TotalHeroHealReq.create(rawReq);
			case 'TOTAL_DISCARD': return TotalDiscardedCardsReq.create(rawReq);
			case 'TOTAL_DAMAGE_DEALT': return TotalDamageDealtReq.create(rawReq);
			case 'TOTAL_ARMOR_GAINED': return TotalArmorGainReq.create(rawReq);
			case 'MINIONS_CONTROLLED_DURING_TURN': return MinionsControlledDuringTurnReq.create(rawReq);
			case 'WIN_STREAK_LENGTH': return WinStreakReq.create(rawReq);
			case 'TOTAL_CARDS_PLAYED': return TotalCardsPlayedReq.create(rawReq, this.cards);
			case 'TOTAL_MINIONS_SUMMONED': return TotalMinionsSummonedReq.create(rawReq, this.cards);
			case 'SAME_MINION_ATTACK_TIMES': return SameMinionAttackReq.create(rawReq, this.cards);
			
			// The very specific reqs
			case 'LAST_DAMAGE_DONE_BY_MINION': return LastDamageDoneByMinionReq.create(rawReq);
			case 'BOARD_FULL_OF_SAME_LEGENDARY_MINION': return BoardFullOfSameLegendaryMinionReq.create(rawReq, this.cards);
			case 'WINS_AGAINST_CLASS_IN_RANKED_STANDARD_IN_LIMITED_TIME': return WinAgsinstClassInRankedStandardInLimitedTimeReq.create(rawReq);
			case 'RESUMMONED_RECURRING_VILLAIN': return ResummonRecurringVillainRew.create(rawReq);
			case 'CARDS_WITH_SAME_ATTRIBUTE_PLAYED': return CardWithSameAttributePlayedReq.create(rawReq, this.cards);
			
			// The deckbuilding reqs
			case 'DECK_CLASSIC': return DeckbuildingClassicReq.create(rawReq, this.cards);
			case 'DECK_RARITY': return DeckbuildingRarityReq.create(rawReq, this.cards);
			case 'DECK_MECHANIC': return DeckbuildingMechanicReq.create(rawReq, this.cards);
			case 'DECK_TYPE': return DeckbuildingTypeReq.create(rawReq, this.cards);
			case 'DECK_CARD_ATTRIBUTE_VALUE': return DeckbuildingCardAttributeReq.create(rawReq, this.cards);
			case 'DECK_CARD_TEXT_VALUE': return DeckbuildingTextReq.create(rawReq, this.cards);
			case 'DECK_CARD_TEXT_NUMBER_OF_WORDS': return DeckbuildingTextNumberOfWordsReq.create(rawReq, this.cards);
			case 'DECK_NO_CARD_WITH_LETTER_IN_NAME': return DeckbuildingNoCardWithLetterInNameReq.create(rawReq, this.cards);
			case 'DECK_CARD_NAME': return DeckbuildingCardNameReq.create(rawReq, this.cards);
			case 'DECK_CARD_COST': return DeckbuildingCostReq.create(rawReq, this.cards);
			case 'DECK_NUMBER_OF_MINIONS': 
				console.debug(''); // No idea why I have to add this for jest to pick up the line
				return DeckbuildingNumberOfMinionsReq.create(rawReq, this.cards);

			// The global stat reqs
			case 'GLOBAL_STAT': return GlobalStatReq.create(rawReq);

			case 'BATTLEGROUNDS_FINISH': return BattlegroundsFinishReq.create(rawReq);
			case 'BATTLEGROUNDS_RANK': return BattlegroundsRankReq.create(rawReq, this.memoryInspection);
			case 'BATTLEGROUNDS_TRIPLE_PLAY': return BattlegroundsTriplePlayReq.create(rawReq);

			default: 
				console.error('No requirement provider found, providing no-op requirement instead', rawReq.type, rawReq);
				return {
					test: () => true,
					afterAchievementCompletionReset: () => true,
					isCompleted: () => true,
					reset: () => true,
				};
		}
	}
}
