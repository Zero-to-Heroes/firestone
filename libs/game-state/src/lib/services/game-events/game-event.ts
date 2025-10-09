import { Rank } from '@firestone/memory';
import { FullGameState } from '../../models/full-game-state';
import { DeckInfo } from '../deck/deck-parser.service';
import { GameStateEvent } from '../game-state-events/game-state-event';

export class GameEvent implements GameStateEvent {
	public static readonly SCENE_CHANGED_MINDVISION = 'SCENE_CHANGED_MINDVISION'; // Not strictly a game event, but needed for requirements procesing
	public static readonly MATCH_METADATA = 'MATCH_METADATA';
	public static readonly REVIEW_ID = 'REVIEW_ID';
	public static readonly PLAYER = 'PLAYER';
	public static readonly LOCAL_PLAYER = 'LOCAL_PLAYER';
	public static readonly OPPONENT = 'OPPONENT';
	public static readonly GAME_RUNNING = 'GAME_RUNNING';
	public static readonly ANOMALY_REVEALED = 'ANOMALY_REVEALED';
	public static readonly INITIAL_CARD_IN_DECK = 'INITIAL_CARD_IN_DECK';
	public static readonly HERO_POWER_USED = 'HERO_POWER_USED';
	public static readonly START_OF_GAME = 'START_OF_GAME';
	public static readonly MULLIGAN_INPUT = 'MULLIGAN_INPUT';
	public static readonly MULLIGAN_INITIAL_OPTION = 'MULLIGAN_INITIAL_OPTION';
	public static readonly MULLIGAN_DEALING = 'MULLIGAN_DEALING';
	public static readonly MULLIGAN_DONE = 'MULLIGAN_DONE';
	public static readonly MAIN_STEP_READY = 'MAIN_STEP_READY';
	public static readonly DECKLIST_UPDATE = 'DECKLIST_UPDATE';
	public static readonly SUB_SPELL_START = 'SUB_SPELL_START';
	public static readonly SUB_SPELL_END = 'SUB_SPELL_END';
	public static readonly TURN_START = 'TURN_START';
	public static readonly TURN_DURATION_UPDATED = 'TURN_DURATION_UPDATED';
	public static readonly SHUFFLE_DECK = 'SHUFFLE_DECK';
	public static readonly COST_CHANGED = 'COST_CHANGED';
	public static readonly SPAWN_TIME_COUNT_CHANGED = 'SPAWN_TIME_COUNT_CHANGED';
	public static readonly ZONE_CHANGED = 'ZONE_CHANGED';
	public static readonly ZONE_POSITION_CHANGED = 'ZONE_POSITION_CHANGED';
	public static readonly GAME_RESULT = 'GAME_RESULT';
	public static readonly MAYBE_DUNGEON_INFO_PICK = 'MAYBE_DUNGEON_INFO_PICK';
	public static readonly GAME_START = 'GAME_START';
	public static readonly GAME_SETTINGS = 'GAME_SETTINGS';
	public static readonly NEW_LOG_LINE = 'NEW_LOG_LINE';
	public static readonly WINNER = 'WINNER';
	public static readonly TIE = 'TIE';
	public static readonly GAME_END = 'GAME_END';
	public static readonly CARD_PLAYED = 'CARD_PLAYED';
	public static readonly CARD_PLAYED_BY_EFFECT = 'CARD_PLAYED_BY_EFFECT';
	public static readonly DISCARD_CARD = 'DISCARD_CARD';
	public static readonly TOURIST_REVEALED = 'TOURIST_REVEALED';
	public static readonly MINIONS_DIED = 'MINIONS_DIED';
	public static readonly MINIONS_WILL_DIE = 'MINIONS_WILL_DIE';
	public static readonly RECRUIT_CARD = 'RECRUIT_CARD';
	public static readonly MINION_BACK_ON_BOARD = 'MINION_BACK_ON_BOARD';
	public static readonly FIRST_PLAYER = 'FIRST_PLAYER';
	public static readonly SECRET_PLAYED_FROM_DECK = 'SECRET_PLAYED_FROM_DECK';
	public static readonly SECRET_CREATED_IN_GAME = 'SECRET_CREATED_IN_GAME';
	public static readonly QUEST_PLAYED_FROM_DECK = 'QUEST_PLAYED_FROM_DECK';
	public static readonly QUEST_CREATED_IN_GAME = 'QUEST_CREATED_IN_GAME';
	public static readonly MINION_SUMMONED = 'MINION_SUMONED';
	public static readonly MINION_SUMMONED_FROM_HAND = 'MINION_SUMMONED_FROM_HAND';
	public static readonly HERO_POWER_CHANGED = 'HERO_POWER_CHANGED';
	public static readonly HERO_CHANGED = 'HERO_CHANGED';
	public static readonly WEAPON_EQUIPPED = 'WEAPON_EQUIPPED';
	public static readonly CARD_REVEALED = 'CARD_REVEALED';
	public static readonly HERO_REVEALED = 'HERO_REVEALED';
	public static readonly LINKED_ENTITY = 'LINKED_ENTITY';
	public static readonly CARD_CHANGED_ON_BOARD = 'CARD_CHANGED_ON_BOARD';
	public static readonly CARD_CHANGED_IN_HAND = 'CARD_CHANGED_IN_HAND';
	public static readonly CARD_CHANGED_IN_DECK = 'CARD_CHANGED_IN_DECK';
	public static readonly CARD_DREDGED = 'CARD_DREDGED';
	public static readonly SECRET_PLAYED = 'SECRET_PLAYED';
	public static readonly SECRET_PUT_IN_PLAY = 'SECRET_PUT_IN_PLAY';
	public static readonly SECRET_WILL_TRIGGER = 'SECRET_WILL_TRIGGER';
	public static readonly COUNTER_TRIGGERED = 'COUNTER_TRIGGERED';
	public static readonly COUNTER_WILL_TRIGGER = 'COUNTER_WILL_TRIGGER';
	public static readonly SECRET_TRIGGERED = 'SECRET_TRIGGERED';
	public static readonly SECRET_DESTROYED = 'SECRET_DESTROYED';
	public static readonly WEAPON_DESTROYED = 'WEAPON_DESTROYED';
	public static readonly QUEST_PLAYED = 'QUEST_PLAYED';
	public static readonly QUEST_DESTROYED = 'QUEST_DESTROYED';
	public static readonly QUEST_COMPLETED = 'QUEST_COMPLETED';
	public static readonly REMOVE_FROM_HISTORY = 'REMOVE_FROM_HISTORY';
	public static readonly DEATHRATTLE_TRIGGERED = 'DEATHRATTLE_TRIGGERED';
	public static readonly CARD_DRAW_FROM_DECK = 'CARD_DRAW_FROM_DECK';
	public static readonly RECEIVE_CARD_IN_HAND = 'RECEIVE_CARD_IN_HAND';
	public static readonly CREATE_CARD_IN_GRAVEYARD = 'CREATE_CARD_IN_GRAVEYARD';
	public static readonly CARD_BUFFED_IN_HAND = 'CARD_BUFFED_IN_HAND';
	public static readonly CARD_CREATOR_CHANGED = 'CARD_CREATOR_CHANGED';
	public static readonly END_OF_ECHO_IN_HAND = 'END_OF_ECHO_IN_HAND';
	public static readonly CREATE_CARD_IN_DECK = 'CREATE_CARD_IN_DECK';
	public static readonly ENCHANTMENT_ATTACHED = 'ENCHANTMENT_ATTACHED';
	public static readonly ENCHANTMENT_DETACHED = 'ENCHANTMENT_DETACHED';
	public static readonly CARD_BACK_TO_DECK = 'CARD_BACK_TO_DECK';
	public static readonly TRADE_CARD = 'TRADE_CARD';
	public static readonly CARD_REMOVED_FROM_DECK = 'CARD_REMOVED_FROM_DECK';
	public static readonly CARD_REMOVED_FROM_HAND = 'CARD_REMOVED_FROM_HAND';
	public static readonly CARD_REMOVED_FROM_BOARD = 'CARD_REMOVED_FROM_BOARD';
	public static readonly BURNED_CARD = 'BURNED_CARD';
	public static readonly CARD_ON_BOARD_AT_GAME_START = 'CARD_ON_BOARD_AT_GAME_START';
	public static readonly PASSIVE_BUFF = 'PASSIVE_BUFF';
	public static readonly MINION_ON_BOARD_ATTACK_UPDATED = 'MINION_ON_BOARD_ATTACK_UPDATED';
	public static readonly ARMOR_CHANGED = 'ARMOR_CHANGED';
	public static readonly CARDS_SHUFFLED_INTO_DECK = 'CARDS_SHUFFLED_INTO_DECK';
	public static readonly LOCATION_USED = 'LOCATION_USED';
	public static readonly LOCATION_DESTROYED = 'LOCATION_DESTROYED';
	public static readonly BLOOD_GEM_BUFF_CHANGED = 'BLOOD_GEM_BUFF_CHANGED';
	public static readonly BEETLE_ARMY_CHANGED = 'BEETLE_ARMY_CHANGED';
	public static readonly TOTAL_MAGNETIZE_CHANGED = 'TOTAL_MAGNETIZE_CHANGED';
	public static readonly BALLER_BUFF_CHANGED = 'BALLER_BUFF_CHANGED';
	public static readonly EXCAVATE_TIER_CHANGED = 'EXCAVATE_TIER_CHANGED';
	public static readonly CORPSES_CHANGED = 'CORPSES_CHANGED';
	public static readonly CORPSES_SPENT_THIS_GAME_CHANGED = 'CORPSES_SPENT_THIS_GAME_CHANGED';
	public static readonly OVERLOADED_CRYSTALS_CHANGED = 'OVERLOADED_CRYSTALS_CHANGED';
	public static readonly DATA_SCRIPT_CHANGED = 'DATA_SCRIPT_CHANGED';
	public static readonly IMMOLATE_CHANGED = 'IMMOLATE_CHANGED';
	public static readonly HEALTH_DEF_CHANGED = 'HEALTH_DEF_CHANGED';
	public static readonly MAX_RESOURCES_UPDATED = 'MAX_RESOURCES_UPDATED';
	public static readonly NUM_CARDS_PLAYED_THIS_TURN = 'NUM_CARDS_PLAYED_THIS_TURN';
	public static readonly NUM_CARDS_DRAW_THIS_TURN = 'NUM_CARDS_DRAW_THIS_TURN';
	public static readonly RESOURCES_THIS_TURN = 'RESOURCES_THIS_TURN';
	public static readonly RESOURCES_UPDATED = 'RESOURCES_UPDATED';
	public static readonly FATIGUE_DAMAGE = 'FATIGUE_DAMAGE';
	public static readonly ATTACKING_HERO = 'ATTACK_ON_HERO';
	public static readonly ATTACKING_MINION = 'ATTACKING_MINION';
	public static readonly DAMAGE = 'DAMAGE';
	public static readonly HEALING = 'HEALING';
	public static readonly CARD_STOLEN = 'CARD_STOLEN';
	public static readonly RUMBLE_RUN_STEP = 'RUMBLE_RUN_STEP';
	public static readonly DUNGEON_RUN_STEP = 'DUNGEON_RUN_STEP';
	public static readonly MONSTER_HUNT_STEP = 'MONSTER_HUNT_STEP';
	public static readonly GALAKROND_INVOKED = 'GALAKROND_INVOKED';
	public static readonly PARENT_CARD_CHANGED = 'PARENT_CARD_CHANGED';
	public static readonly MINION_GO_DORMANT = 'MINION_GO_DORMANT';
	public static readonly CARD_FORGED = 'CARD_FORGED';
	public static readonly STARSHIP_LAUNCHED = 'STARSHIP_LAUNCHED';
	public static readonly JADE_GOLEM = 'JADE_GOLEM';
	public static readonly CTHUN = 'CTHUN';
	public static readonly MINDRENDER_ILLUCIA_START = 'MINDRENDER_ILLUCIA_START';
	public static readonly MINDRENDER_ILLUCIA_END = 'MINDRENDER_ILLUCIA_END';

	public static readonly GAME_STATE_UPDATE = 'GAME_STATE_UPDATE';
	public static readonly TOTAL_ATTACK_ON_BOARD = 'TOTAL_ATTACK_ON_BOARD';
	public static readonly ENTITY_UPDATE = 'ENTITY_UPDATE';
	public static readonly ENTITY_CHOSEN = 'ENTITY_CHOSEN';
	public static readonly COPIED_FROM_ENTITY_ID = 'COPIED_FROM_ENTITY_ID';
	public static readonly CHOOSING_OPTIONS = 'CHOOSING_OPTIONS';
	public static readonly SPECIAL_CARD_POWER_TRIGGERED = 'SPECIAL_CARD_POWER_TRIGGERED';
	public static readonly WHEEL_OF_DEATH_COUNTER_UPDATED = 'WHEEL_OF_DEATH_COUNTER_UPDATED';

	public static readonly SPECTATING = 'SPECTATING';
	public static readonly ARCHETYPE_CATEGORIZATION = 'ARCHETYPE_CATEGORIZATION';

	public static readonly LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED = 'LOCAL_PLAYER_LEADERBOARD_PLACE_CHANGED';
	public static readonly BATTLEGROUNDS_HERO_SELECTION = 'BATTLEGROUNDS_HERO_SELECTION';
	public static readonly BATTLEGROUNDS_HERO_SELECTED = 'BATTLEGROUNDS_HERO_SELECTED';
	public static readonly BATTLEGROUNDS_GLOBAL_INFO_UPDATE = 'BATTLEGROUNDS_GLOBAL_INFO_UPDATE';
	public static readonly BATTLEGROUNDS_HERO_REROLL = 'BATTLEGROUNDS_HERO_REROLL';
	public static readonly BATTLEGROUNDS_TRINKET_SELECTION = 'BATTLEGROUNDS_TRINKET_SELECTION';
	public static readonly BATTLEGROUNDS_TRINKET_SELECTED = 'BATTLEGROUNDS_TRINKET_SELECTED';
	public static readonly BATTLEGROUNDS_PLAYER_BOARD = 'BATTLEGROUNDS_PLAYER_BOARD';
	public static readonly BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD = 'BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD';
	public static readonly BATTLEGROUNDS_LEADERBOARD_PLACE = 'BATTLEGROUNDS_LEADERBOARD_PLACE';
	public static readonly BATTLEGROUNDS_TAVERN_UPGRADE = 'BATTLEGROUNDS_TAVERN_UPGRADE';
	public static readonly BATTLEGROUNDS_BUDDY_GAINED = 'BATTLEGROUNDS_BUDDY_GAINED';
	public static readonly BATTLEGROUNDS_REWARD_REVEALED = 'BATTLEGROUNDS_REWARD_REVEALED';
	public static readonly BATTLEGROUNDS_REWARD_GAINED = 'BATTLEGROUNDS_REWARD_GAINED';
	public static readonly BATTLEGROUNDS_QUEST_REWARD_EQUIPPED = 'BATTLEGROUNDS_QUEST_REWARD_EQUIPPED';
	public static readonly BATTLEGROUNDS_QUEST_REWARD_DESTROYED = 'BATTLEGROUNDS_QUEST_REWARD_DESTROYED';
	public static readonly BATTLEGROUNDS_NEXT_OPPONENT = 'BATTLEGROUNDS_NEXT_OPPONENT';
	public static readonly BATTLEGROUNDS_OPPONENT_REVEALED = 'BATTLEGROUNDS_OPPONENT_REVEALED';
	public static readonly BATTLEGROUNDS_COMBAT_START = 'BATTLEGROUNDS_COMBAT_START';
	public static readonly BATTLEGROUNDS_RECRUIT_PHASE = 'BATTLEGROUNDS_RECRUIT_PHASE';
	public static readonly BATTLEGROUNDS_BATTLE_RESULT = 'BATTLEGROUNDS_BATTLE_RESULT';
	public static readonly BATTLEGROUNDS_BATTLE_SIMULATION = 'BATTLEGROUNDS_BATTLE_SIMULATION';
	public static readonly BATTLEGROUNDS_TRIPLE = 'BATTLEGROUNDS_TRIPLE';
	public static readonly BATTLEGROUNDS_REROLL = 'BATTLEGROUNDS_REROLL';
	public static readonly BATTLEGROUNDS_FREEZE = 'BATTLEGROUNDS_FREEZE';
	public static readonly BATTLEGROUNDS_MINION_BOUGHT = 'BATTLEGROUNDS_MINION_BOUGHT';
	public static readonly BATTLEGROUNDS_MINION_SOLD = 'BATTLEGROUNDS_MINION_SOLD';
	public static readonly BATTLEGROUNDS_ENEMY_HERO_KILLED = 'BATTLEGROUNDS_ENEMY_HERO_KILLED';
	public static readonly BATTLEGROUNDS_ACTIVE_PLAYER_BOARD = 'BATTLEGROUNDS_ACTIVE_PLAYER_BOARD';
	public static readonly BATTLEGROUNDS_ACTIVE_PLAYER_BOARD_PROCESS = 'BATTLEGROUNDS_ACTIVE_PLAYER_BOARD_PROCESS';
	public static readonly BATTLEGROUNDS_REAL_TIME_STATS_UPDATE = 'BATTLEGROUNDS_REAL_TIME_STATS_UPDATE';

	public static readonly MERCENARIES_HERO_REVEALED = 'MERCENARIES_HERO_REVEALED';
	public static readonly MERCENARIES_ABILITY_REVEALED = 'MERCENARIES_ABILITY_REVEALED';
	public static readonly MERCENARIES_ABILITY_UPDATE = 'MERCENARIES_ABILITY_UPDATE';
	public static readonly MERCENARIES_ABILITY_ACTIVATED = 'MERCENARIES_ABILITY_ACTIVATED';
	public static readonly MERCENARIES_EQUIPMENT_REVEALED = 'MERCENARIES_EQUIPMENT_REVEALED';
	public static readonly MERCENARIES_EQUIPMENT_UPDATE = 'MERCENARIES_EQUIPMENT_UPDATE';
	public static readonly MERCENARIES_COOLDOWN_UPDATED = 'MERCENARIES_COOLDOWN_UPDATED';
	public static readonly MERCENARIES_ABILITY_QUEUED = 'MERCENARIES_ABILITY_QUEUED';
	public static readonly MERCENARIES_ABILITY_UNQUEUED = 'MERCENARIES_ABILITY_UNQUEUED';
	public static readonly MERCENARIES_HERO_REVIVED = 'MERCENARIES_HERO_REVIVED';

	// public static readonly ACHIEVEMENT_PROGRESS = 'ACHIEVEMENT_PROGRESS';
	public static readonly DECKSTRING_OVERRIDE = 'DECKSTRING_OVERRIDE';
	public static readonly WHIZBANG_DECK_ID = 'WHIZBANG_DECK_ID';

	public static readonly RECONNECT_START = 'RECONNECT_START';
	public static readonly RECONNECT_OVER = 'RECONNECT_OVER';

	public static readonly MATCH_INFO = 'MATCH_INFO';
	public static readonly PLAYER_DECK_INFO = 'PLAYER_DECK_INFO';
	public static readonly MERCENARIES_INFO = 'MERCENARIES_INFO';
	public static readonly BATTLEGROUNDS_INFO = 'BATTLEGROUNDS_INFO';
	public static readonly BATTLEGROUNDS_MMR_AT_START = 'BATTLEGROUNDS_MMR_AT_START';

	readonly type: string;
	readonly cardId: string;
	readonly controllerId: number; // matches a PlayerId
	readonly localPlayer: GameEventPlayer;
	readonly opponentPlayer: GameEventPlayer;
	readonly entityId: number;
	readonly gameState: FullGameState = {} as FullGameState;

	readonly additionalData: any;

	public static build(type: string, gameEvent: any, additionalProps?: any): GameEvent {
		return Object.assign(new GameEvent(), {
			type: type,
			cardId: gameEvent.Value.CardId,
			controllerId: gameEvent.Value.ControllerId,
			localPlayer: gameEvent.Value.LocalPlayer ?? {},
			opponentPlayer: gameEvent.Value.OpponentPlayer ?? {},
			entityId: parseInt(gameEvent.Value.EntityId || 0),
			gameState: gameEvent.Value.GameState,
			additionalData: additionalProps,
		} as GameEvent);
	}

	public parse(): [string, number, GameEventPlayer, number] {
		// cardId being "null" needs to be a conscious choice, as it triggers specific
		// processes when looking for the card in the other zones
		return [this.cardId ?? '', this.controllerId, this.localPlayer, this.entityId];
	}
}

export interface GameEventPlayer {
	Id: number;
	AccountHi: string;
	AccountLo: string;
	PlayerId: number;
	Name: string;
	// This is not updated when the hero changes, so use currentState.playerDeck.hero?.cardId instead
	CardID: string;
	standard: Rank;
	wild: Rank;
	// standardRank: number;
	// standardLegendRank: number;
	// wildRank: number;
	// wildLegendRank: number;
	cardBackId: number;
	deck: DeckInfo;
}
