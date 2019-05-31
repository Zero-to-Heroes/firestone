export class DeckEvents {
    public static readonly GAME_START = 'DECK_GAME_START';
    public static readonly MATCH_METADATA = 'MATCH_METADATA';
    public static readonly CARD_BACK_TO_DECK = 'DECK_CARD_BACK_TO_DECK';
    public static readonly CARD_REMOVED_FROM_DECK = 'CARD_REMOVED_FROM_DECK';
    public static readonly BURNED_CARD = 'BURNED_CARD';
    public static readonly CARD_REMOVED_FROM_HAND = 'CARD_REMOVED_FROM_HAND';
    public static readonly CARD_PLAYED_FROM_HAND = 'CARD_PLAYED_FROM_HAND';
    public static readonly DISCARD_CARD = 'DISCARD_CARD';
    public static readonly RECRUIT_CARD = 'RECRUIT_CARD';
    public static readonly SECRET_PLAYED_FROM_DECK = 'SECRET_PLAYED_FROM_DECK';
    public static readonly MINION_SUMMONED = 'MINION_SUMMONED';
    public static readonly SECRET_PLAYED_FROM_HAND = 'SECRET_PLAYED_FROM_HAND';
    public static readonly CARD_DRAW = 'DECK_CARD_DRAW';
    public static readonly RECEIVE_CARD_IN_HAND = 'RECEIVE_CARD_IN_HAND';
    public static readonly END_OF_ECHO_IN_HAND = 'END_OF_ECHO_IN_HAND';
    public static readonly CREATE_CARD_IN_DECK = 'CREATE_CARD_IN_DECK';
    public static readonly GAME_END = 'DECK_GAME_END';
    public static readonly MULLIGAN_OVER = 'DECK_MULLIGAN_OVER';
}