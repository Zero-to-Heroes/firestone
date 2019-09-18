import { Injectable } from '@angular/core';
import { RawAchievement } from '../../../../models/achievement/raw-achievement';
import { RawRequirement } from '../../../../models/achievement/raw-requirement';
import { AllCardsService } from '../../../all-cards.service';
import { ArmorAtEndReq } from '../requirements/armor-at-end-req';
import { CardDrawnOrReceivedInHandReq } from '../requirements/card-drawn-or-received-in-hand-req';
import { CardPlayedOrChangedOnBoardReq } from '../requirements/card-played-or-changed-on-board-req';
import { CardPlayedOrOnBoardAtGameStartReq } from '../requirements/card-played-or-on-board-at-game-start-req';
import { CorrectOpponentReq } from '../requirements/correct-opponent-req';
import { CorrectStartingHealthReq } from '../requirements/correct-starting-health-req';
import { DamageAtEndReq } from '../requirements/damage-at-end-req';
import { DeckbuildingClassicReq } from '../requirements/deckbuilding/deckbuilding-classic-req';
import { DeckbuildingEpicReq } from '../requirements/deckbuilding/deckbuilding-epic-req';
import { DeckbuildingMechanicReq } from '../requirements/deckbuilding/deckbuilding-mechanic-req';
import { DeckbuildingNoCardWithLetterInNameReq } from '../requirements/deckbuilding/deckbuilding-no-card-with-letter-in-name-req';
import { DeckbuildingNumberOfMinionsReq } from '../requirements/deckbuilding/deckbuilding-number-of-minions-req';
import { DungeonRunStepReq } from '../requirements/dungeon-run-step-req';
import { ExcludedScenarioIdReq } from '../requirements/excluded-scenario-id-req';
import { FormatTypeReq } from '../requirements/format-type-req';
import { GameMinTurnsReq } from '../requirements/game-min-turns-req';
import { GameTieReq } from '../requirements/game-tie-req';
import { GameTypeReq } from '../requirements/game-type-req';
import { GameWonReq } from '../requirements/game-won-req';
import { HealthAtEndReq } from '../requirements/health-at-end-req';
import { MinionSummonedReq } from '../requirements/minion-summoned-req';
import { MinionsControlledDuringTurnReq } from '../requirements/minions-controlled-during-turn-req';
import { MonsterHuntStepReq } from '../requirements/monster-hunt-step-req';
import { MulliganDoneReq } from '../requirements/mulligan-done-req';
import { PassiveBuffReq } from '../requirements/passive-buff-req';
import { PlayerHeroReq } from '../requirements/player-hero-req';
import { ResummonRecurringVillainRew } from '../requirements/resummon-recurring-villain-req';
import { RumbleRunStepReq } from '../requirements/rumble-run-step-req';
import { ScenarioIdReq } from '../requirements/scenario-id-req';
import { SceneChangedToGameReq } from '../requirements/scene-changed-to-game-req';
import { StandardRankedMinRankReq } from '../requirements/standard-ranked-min-rank-req';
import { TotalArmorGainReq } from '../requirements/total-armor-gain-req';
import { TotalDamageDealtReq } from '../requirements/total-damage-dealt-req';
import { TotalDamageTakenReq } from '../requirements/total-damage-taken-req';
import { TotalDiscardedCardsReq } from '../requirements/total-discarded-cards-req';
import { TotalHeroHealReq } from '../requirements/total-hero-heal-req';
import { WinAgsinstClassInRankedStandardInLimitedTimeReq } from '../requirements/win-against-class-in-ranked-standard-in-limited-time-req';
import { WinStreakReq } from '../requirements/win-streak-req';
import { Requirement } from '../requirements/_requirement';
import { Challenge } from './challenge';
import { GenericChallenge } from './generic-challenge';

@Injectable()
export class ChallengeBuilderService {
	constructor(private readonly cards: AllCardsService) {}

	public buildChallenge(raw: RawAchievement): Challenge {
		const requirements: readonly Requirement[] = this.buildRequirements(raw.requirements);
		return new GenericChallenge(raw.id, raw.resetEvents, requirements);
	}

	private buildRequirements(rawReqs: readonly RawRequirement[]): readonly Requirement[] {
		return rawReqs.map(rawReq => this.buildRequirement(rawReq));
	}

	private buildRequirement(rawReq: RawRequirement): Requirement {
		// prettier-ignore
		switch (rawReq.type) {
			case 'DUNGEON_RUN_STEP': return DungeonRunStepReq.create(rawReq);
			case 'MONSTER_HUNT_STEP': return MonsterHuntStepReq.create(rawReq);
			case 'RUMBLE_RUN_STEP': return RumbleRunStepReq.create(rawReq);
			case 'GAME_TYPE': return GameTypeReq.create(rawReq);
			case 'RANKED_MIN_RANK': return StandardRankedMinRankReq.create(rawReq);
			case 'RANKED_FORMAT_TYPE': return FormatTypeReq.create(rawReq);
			case 'SCENARIO_IDS': return ScenarioIdReq.create(rawReq);
			case 'EXCLUDED_SCENARIO_IDS': return ExcludedScenarioIdReq.create(rawReq);
			case 'MULLIGAN_DONE': return MulliganDoneReq.create(rawReq);
			case 'GAME_WON': return GameWonReq.create(rawReq);
			case 'GAME_TIE': return GameTieReq.create(rawReq);
			case 'GAME_MIN_TURNS': return GameMinTurnsReq.create(rawReq);
			case 'PLAYER_HERO': return PlayerHeroReq.create(rawReq);
			case 'CORRECT_OPPONENT': return CorrectOpponentReq.create(rawReq);
			case 'CORRECT_STARTING_HEALTH': return CorrectStartingHealthReq.create(rawReq);
			case 'SCENE_CHANGED_TO_GAME': return SceneChangedToGameReq.create(rawReq);
			case 'CARD_PLAYED_OR_CHANGED_ON_BOARD': return CardPlayedOrChangedOnBoardReq.create(rawReq);
			case 'CARD_PLAYED_OR_ON_BOARD_AT_GAME_START': return CardPlayedOrOnBoardAtGameStartReq.create(rawReq);
			case 'CARD_DRAWN_OR_RECEIVED_IN_HAND': return CardDrawnOrReceivedInHandReq.create(rawReq);
			case 'MINION_SUMMONED': return MinionSummonedReq.create(rawReq);
			case 'PASSIVE_BUFF': return PassiveBuffReq.create(rawReq);
			case 'HEALTH_AT_END': return HealthAtEndReq.create(rawReq);
			case 'DAMAGE_AT_END': return DamageAtEndReq.create(rawReq);
			case 'ARMOR_AT_END': return ArmorAtEndReq.create(rawReq);
			case 'TOTAL_DAMAGE_TAKEN': return TotalDamageTakenReq.create(rawReq);
			case 'TOTAL_HERO_HEAL': return TotalHeroHealReq.create(rawReq);
			case 'TOTAL_DISCARD': return TotalDiscardedCardsReq.create(rawReq);
			case 'TOTAL_DAMAGE_DEALT': return TotalDamageDealtReq.create(rawReq);
			case 'TOTAL_ARMOR_GAINED': return TotalArmorGainReq.create(rawReq);
			case 'MINIONS_CONTROLLED_DURING_TURN': return MinionsControlledDuringTurnReq.create(rawReq);
			case 'RESUMMONED_RECURRING_VILLAIN': return ResummonRecurringVillainRew.create(rawReq);
			case 'WIN_STREAK_LENGTH': return WinStreakReq.create(rawReq);
			case 'WINS_AGAINST_CLASS_IN_RANKED_STANDARD_IN_LIMITED_TIME': return WinAgsinstClassInRankedStandardInLimitedTimeReq.create(rawReq);
			
			case 'DECK_CLASSIC': return DeckbuildingClassicReq.create(rawReq, this.cards);
			case 'DECK_EPIC': return DeckbuildingEpicReq.create(rawReq, this.cards);
			case 'DECK_MECHANIC': return DeckbuildingMechanicReq.create(rawReq, this.cards);
			case 'DECK_NO_CARD_WITH_LETTER_IN_NAME': return DeckbuildingNoCardWithLetterInNameReq.create(rawReq, this.cards);
			case 'DECK_NUMBER_OF_MINIONS': 
				console.debug(''); // No idea why I have to add this for jest to pick up the line
				return DeckbuildingNumberOfMinionsReq.create(rawReq, this.cards);
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
