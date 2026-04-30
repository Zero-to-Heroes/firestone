import { GameEvent } from '@firestone/game-state';

/**
 * Game event types each raw requirement implementation may observe in {@link Requirement.test}.
 * {@link ALL_GAME_EVENTS_TOKEN} means the requirement runs logic on every event (or has no cheap filter).
 */
export const ALL_GAME_EVENTS_TOKEN = '*' as const;

export type RequirementGameEventInterest = readonly string[] | typeof ALL_GAME_EVENTS_TOKEN;

/** Maps RawRequirement.type (JSON) to game event types used by the matching Requirement class. */
export function getInterestedGameEventsForRawRequirementType(requirementType: string): RequirementGameEventInterest {
	switch (requirementType) {
		case 'DUNGEON_RUN_STEP':
			return [GameEvent.DUNGEON_RUN_STEP];
		case 'MONSTER_HUNT_STEP':
			return [GameEvent.MONSTER_HUNT_STEP];
		case 'RUMBLE_RUN_STEP':
			return [GameEvent.RUMBLE_RUN_STEP];
		case 'GAME_TYPE':
			return [GameEvent.MATCH_METADATA];
		case 'RANKED_MIN_LEAGUE':
			return [GameEvent.MATCH_METADATA, GameEvent.MATCH_INFO];
		case 'RANKED_FORMAT_TYPE':
			return [GameEvent.MATCH_METADATA];
		case 'SCENARIO_IDS':
			return [GameEvent.MATCH_METADATA];
		case 'EXCLUDED_SCENARIO_IDS':
			return [GameEvent.MATCH_METADATA];
		case 'MULLIGAN_DONE':
			return [GameEvent.MULLIGAN_DONE];
		case 'GAME_WON':
			return [GameEvent.WINNER];
		case 'GAME_TIE':
			return [GameEvent.TIE];
		case 'GAME_MIN_TURNS':
		case 'GAME_MAX_TURN':
		case 'GAME_MAX_TURNS':
			return [GameEvent.TURN_START];
		case 'PLAYER_HERO':
			return [GameEvent.LOCAL_PLAYER];
		case 'PLAYER_CLASS':
			return [GameEvent.LOCAL_PLAYER];
		case 'CORRECT_OPPONENT':
			return [GameEvent.OPPONENT];
		case 'CORRECT_STARTING_HEALTH':
			return [GameEvent.CARD_ON_BOARD_AT_GAME_START, GameEvent.HEALTH_DEF_CHANGED];
		case 'SCENE_CHANGED_TO_GAME':
			return [GameEvent.SCENE_CHANGED_MINDVISION];
		case 'CARD_PLAYED_OR_CHANGED_ON_BOARD':
			return [GameEvent.CARD_PLAYED, GameEvent.MINION_SUMMONED_FROM_HAND, GameEvent.CARD_CHANGED_ON_BOARD];
		case 'BATTLEGROUNDS_HERO_SELECTED':
			return [GameEvent.BATTLEGROUNDS_HERO_SELECTED];
		case 'CARD_PLAYED_OR_ON_BOARD_AT_GAME_START':
			return [
				GameEvent.CARD_PLAYED,
				GameEvent.MINION_SUMMONED_FROM_HAND,
				GameEvent.CARD_ON_BOARD_AT_GAME_START,
			];
		case 'CARD_NOT_PLAYED':
			return [GameEvent.CARD_PLAYED];
		case 'CARD_DRAWN_OR_RECEIVED_IN_HAND':
			return [GameEvent.CARD_DRAW_FROM_DECK, GameEvent.RECEIVE_CARD_IN_HAND];
		case 'MINION_SUMMONED':
			return [GameEvent.MINION_SUMMONED];
		case 'SECRET_TRIGGERED':
			return [GameEvent.SECRET_TRIGGERED];
		case 'DEATHRATTLE_TRIGGERED':
			return [GameEvent.DEATHRATTLE_TRIGGERED];
		case 'PASSIVE_BUFF':
			return [GameEvent.PASSIVE_BUFF];
		case 'MINION_ATTACK_ON_BOARD':
			return [
				GameEvent.MINION_ON_BOARD_ATTACK_UPDATED,
				GameEvent.MINION_SUMMONED,
				GameEvent.MINION_SUMMONED_FROM_HAND,
				GameEvent.CARD_PLAYED,
			];
		case 'HEALTH_AT_END':
			return [GameEvent.GAME_END];
		case 'DAMAGE_AT_END':
			return [GameEvent.GAME_END];
		case 'FATIGUE_DAMAGE':
			return [GameEvent.FATIGUE_DAMAGE];
		case 'ARMOR_AT_END':
			return [GameEvent.GAME_END];
		case 'TOTAL_DAMAGE_TAKEN':
			return [GameEvent.DAMAGE, GameEvent.FATIGUE_DAMAGE];
		case 'TOTAL_HERO_HEAL':
			return [GameEvent.HEALING];
		case 'TOTAL_DISCARD':
			return [GameEvent.DISCARD_CARD];
		case 'TOTAL_DAMAGE_DEALT':
			return [GameEvent.DAMAGE];
		case 'TOTAL_ARMOR_GAINED':
			return [GameEvent.ARMOR_CHANGED];
		case 'MINIONS_CONTROLLED_DURING_TURN':
			return ALL_GAME_EVENTS_TOKEN;
		case 'WIN_STREAK_LENGTH':
			return ALL_GAME_EVENTS_TOKEN;
		case 'TOTAL_CARDS_PLAYED':
			return [GameEvent.CARD_PLAYED, GameEvent.SECRET_PLAYED, GameEvent.SECRET_PLAYED_FROM_DECK];
		case 'TOTAL_MINIONS_SUMMONED':
			return [GameEvent.MINION_SUMMONED, GameEvent.MINION_SUMMONED_FROM_HAND, GameEvent.CARD_PLAYED];
		case 'SAME_MINION_ATTACK_TIMES':
			return [GameEvent.ATTACKING_HERO, GameEvent.ATTACKING_MINION];
		case 'LAST_DAMAGE_DONE_BY_MINION':
			return [GameEvent.DAMAGE];
		case 'BOARD_FULL_OF_SAME_LEGENDARY_MINION':
			return ALL_GAME_EVENTS_TOKEN;
		case 'WINS_AGAINST_CLASS_IN_RANKED_STANDARD_IN_LIMITED_TIME':
			return ALL_GAME_EVENTS_TOKEN;
		case 'RESUMMONED_RECURRING_VILLAIN':
			return [GameEvent.MINION_SUMMONED];
		case 'CARDS_WITH_SAME_ATTRIBUTE_PLAYED':
			return [GameEvent.CARD_PLAYED];
		case 'DECK_CLASSIC':
		case 'DECK_RARITY':
		case 'DECK_MECHANIC':
		case 'DECK_TYPE':
		case 'DECK_CARD_ATTRIBUTE_VALUE':
		case 'DECK_CARD_TEXT_VALUE':
		case 'DECK_CARD_TEXT_NUMBER_OF_WORDS':
		case 'DECK_NO_CARD_WITH_LETTER_IN_NAME':
		case 'DECK_CARD_NAME':
		case 'DECK_CARD_COST':
		case 'DECK_NUMBER_OF_MINIONS':
			return [GameEvent.MATCH_INFO];
		case 'BATTLEGROUNDS_FINISH':
			return [GameEvent.GAME_END, GameEvent.LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED];
		case 'BATTLEGROUNDS_RANK':
			return [GameEvent.MATCH_METADATA, GameEvent.WINNER];
		case 'BATTLEGROUNDS_TRIPLE_PLAY':
			return [GameEvent.CARD_DRAW_FROM_DECK, GameEvent.RECEIVE_CARD_IN_HAND];
		default:
			return ALL_GAME_EVENTS_TOKEN;
	}
}
