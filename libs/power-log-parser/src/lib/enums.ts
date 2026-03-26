/**
 * Parser-internal synthetic GameTag values.
 *
 * These are custom tags used only within the parser's entity state.
 * They do NOT come from Hearthstone's power.log and are NOT part of
 * the official GameTag enum in @firestone-hs/reference-data.
 *
 * The 133790000+ range is reserved for parser-internal markers.
 */
export enum ParserGameTag {
	DEAL_DAMAGE = 133790004,
	SPEND_CORPSE = 133790005,
	SHOW_ENTITY_START = 133790006,
	PARENT_CARD = 133790007,
	SECRET_HAS_TRIGGERED = 133790009,
}

/**
 * Hearthstone game-entity State values.
 * Not exported by @firestone-hs/reference-data, so defined locally.
 */
export enum State {
	INVALID = 0,
	LOADING = 1,
	RUNNING = 2,
	COMPLETE = 3,
}

/**
 * MetaDataType values from the C# parser (HearthstoneReplays.Enums.MetaDataType).
 * Must match the C# enum exactly for log parsing to work correctly.
 */
export enum MetaDataType {
	META_TARGET = 0,
	TARGET = 0,
	META_DAMAGE = 1,
	DAMAGE = 1,
	META_HEALING = 2,
	HEALING = 2,
	JOUST = 3,
	CLIENT_HISTORY = 4,
	SHOW_BIG_CARD = 5,
	EFFECT_TIMING = 6,
	HISTORY_TARGET = 7,
	OVERRIDE_HISTORY = 8,
	HISTORY_TARGET_DONT_DUPLICATE_UNTIL_END = 9,
	BEGIN_ARTIFICIAL_HISTORY_TILE = 10,
	BEGIN_ARTIFICIAL_HISTORY_TRIGGER_TILE = 11,
	END_ARTIFICIAL_HISTORY_TILE = 12,
	START_DRAW = 13,
	BURNED_CARD = 14,
	EFFECT_SELECTION = 15,
	BEGIN_LISTENING_FOR_TURN_EVENTS = 16,
	HOLD_DRAWN_CARD = 17,
	CONTROLLER_AND_ZONE_CHANGE = 18,
	ARTIFICIAL_PAUSE = 19,
	SLUSH_TIME = 20,
	ARTIFICIAL_HISTORY_INTERRUPT = 21,
	POISONOUS = 22,
	CRITICAL_HIT = 23,
	HISTORY_TRIGGER_SOURCE = 24,
	HISTORY_SOURCE_OWNER = 25,
	HISTORY_REMOVE_ENTITIES = 26,
	SPEND_HEALTH = 27,
	SPEND_ARMOR = 28,
}
