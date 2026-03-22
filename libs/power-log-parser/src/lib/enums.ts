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
 * MetaDataType values from the C# parser.
 * Maps to MetaTags in @firestone-hs/reference-data with some additions.
 */
export enum MetaDataType {
	TARGET = 0,
	DAMAGE = 1,
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
	ARTIFICIAL_PAUSE = 18,
	BEGIN_ARTIFICIAL_HISTORY_CARD_TILE = 19,
	OVERRIDE_HISTORY_AT_END = 20,
	BEGIN_TURN_DISPLAY_TIMER = 21,
	JUNK_1 = 22,
	FATIGUE = 23,
	START_OPPONENTS_DRAW = 24,
	BEGIN_ARTIFICIAL_REVEAL_TILE = 25,
	SKIP_TURN_TIMER = 26,
	SHOW_OPPONENT_BIG_CARD = 27,
	PLAYED_CARD_COST = 28,
}
