import type { Helper } from '../helper';
import { GameEventProvider } from '../game-event';
import { Game, MetaData, Node, Option, Options, SubOption, Target } from '../models';
import { Regexes } from '../regexes';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const OptionTypeEnum: Record<string, number> = {
	PASS: 1,
	END_TURN: 2,
	POWER: 3,
};

const PlayReqEnum: Record<string, number> = {
	INVALID: -1,
	NONE: -1,
	REQ_MINION_TARGET: 1,
	REQ_FRIENDLY_TARGET: 2,
	REQ_ENEMY_TARGET: 3,
	REQ_DAMAGED_TARGET: 4,
	REQ_ENCHANTED_TARGET: 5,
	REQ_MAX_SECRETS: 5,
	REQ_FROZEN_TARGET: 6,
	REQ_CHARGE_TARGET: 7,
	REQ_TARGET_MAX_ATTACK: 8,
	REQ_NONSELF_TARGET: 9,
	REQ_TARGET_WITH_RACE: 10,
	REQ_TARGET_TO_PLAY: 11,
	REQ_NUM_MINION_SLOTS: 12,
	REQ_WEAPON_EQUIPPED: 13,
	REQ_ENOUGH_MANA: 14,
	REQ_YOUR_TURN: 15,
	REQ_NONSTEALTH_ENEMY_TARGET: 16,
	REQ_HERO_TARGET: 17,
	REQ_SECRET_ZONE_CAP: 18,
	REQ_SECRET_CAP: 18,
	REQ_MINION_CAP_IF_TARGET_AVAILABLE: 19,
	REQ_MINION_CAP: 20,
	REQ_TARGET_ATTACKED_THIS_TURN: 21,
	REQ_TARGET_IF_AVAILABLE: 22,
	REQ_MINIMUM_ENEMY_MINIONS: 23,
	REQ_TARGET_FOR_COMBO: 24,
	REQ_NOT_EXHAUSTED_ACTIVATE: 25,
	REQ_UNIQUE_SECRET_OR_QUEST: 26,
	REQ_UNIQUE_SECRET: 26,
	REQ_TARGET_TAUNTER: 27,
	REQ_CAN_BE_ATTACKED: 28,
	REQ_ACTION_PWR_IS_MASTER_PWR: 29,
	REQ_TARGET_MAGNET: 30,
	REQ_ATTACK_GREATER_THAN_0: 31,
	REQ_ATTACKER_NOT_FROZEN: 32,
	REQ_HERO_OR_MINION_TARGET: 33,
	REQ_CAN_BE_TARGETED_BY_SPELLS: 34,
	REQ_SUBCARD_IS_PLAYABLE: 35,
	REQ_TARGET_FOR_NO_COMBO: 36,
	REQ_NOT_MINION_JUST_PLAYED: 37,
	REQ_NOT_EXHAUSTED_HERO_POWER: 38,
	REQ_CAN_BE_TARGETED_BY_OPPONENTS: 39,
	REQ_ATTACKER_CAN_ATTACK: 40,
	REQ_TARGET_MIN_ATTACK: 41,
	REQ_CAN_BE_TARGETED_BY_HERO_POWERS: 42,
	REQ_ENEMY_TARGET_NOT_IMMUNE: 43,
	REQ_ENTIRE_ENTOURAGE_NOT_IN_PLAY: 44,
	REQ_MINIMUM_TOTAL_MINIONS: 45,
	REQ_MUST_TARGET_TAUNTER: 46,
	REQ_UNDAMAGED_TARGET: 47,
	REQ_CAN_BE_TARGETED_BY_BATTLECRIES: 48,
	REQ_STEADY_SHOT: 49,
	REQ_MINION_OR_ENEMY_HERO: 50,
	REQ_TARGET_IF_AVAILABLE_AND_DRAGON_IN_HAND: 51,
	REQ_LEGENDARY_TARGET: 52,
	REQ_FRIENDLY_MINION_DIED_THIS_TURN: 53,
	REQ_FRIENDLY_MINION_DIED_THIS_GAME: 54,
	REQ_ENEMY_WEAPON_EQUIPPED: 55,
	REQ_TARGET_IF_AVAILABLE_AND_MINIMUM_FRIENDLY_MINIONS: 56,
	REQ_TARGET_WITH_BATTLECRY: 57,
	REQ_TARGET_WITH_DEATHRATTLE: 58,
	REQ_TARGET_IF_AVAILABLE_AND_MINIMUM_FRIENDLY_SECRETS: 59,
	REQ_SECRET_CAP_FOR_NON_SECRET: 60,
	REQ_SECRET_ZONE_CAP_FOR_NON_SECRET: 60,
	REQ_TARGET_EXACT_COST: 61,
	REQ_STEALTHED_TARGET: 62,
	REQ_MINION_SLOT_OR_MANA_CRYSTAL_SLOT: 63,
	REQ_MAX_QUESTS: 64,
	REQ_TARGET_IF_AVAILABE_AND_ELEMENTAL_PLAYED_LAST_TURN: 65,
	REQ_TARGET_NOT_VAMPIRE: 66,
	REQ_TARGET_NOT_DAMAGEABLE_ONLY_BY_WEAPONS: 67,
	REQ_NOT_DISABLED_HERO_POWER: 68,
	REQ_MUST_PLAY_OTHER_CARD_FIRST: 69,
	REQ_HAND_NOT_FULL: 70,
	REQ_TARGET_IF_AVAILABLE_AND_NO_3_COST_CARD_IN_DECK: 71,
	REQ_CAN_BE_TARGETED_BY_COMBOS: 72,
	REQ_CANNOT_PLAY_THIS: 73,
	REQ_FRIENDLY_MINIONS_OF_RACE_DIED_THIS_GAME: 74,
	REQ_DRAG_TO_PLAY_PRE29933: 75,
	REQ_OPPONENT_PLAYED_CARDS_THIS_GAME: 77,
	REQ_LITERALLY_UNPLAYABLE: 78,
	REQ_TARGET_IF_AVAILABLE_AND_HERO_HAS_ATTACK: 79,
	REQ_FRIENDLY_MINION_OF_RACE_DIED_THIS_TURN: 80,
	REQ_TARGET_IF_AVAILABLE_AND_MINIMUM_SPELLS_PLAYED_THIS_TURN: 81,
	REQ_FRIENDLY_MINION_OF_RACE_IN_HAND: 82,
	REQ_DRAG_TO_PLAY_PRE31761: 83,
	REQ_FRIENDLY_DEATHRATTLE_MINION_DIED_THIS_GAME: 86,
	REQ_FRIENDLY_REBORN_MINION_DIED_THIS_GAME: 89,
	REQ_MINION_DIED_THIS_GAME: 90,
	REQ_BOARD_NOT_COMPLETELY_FULL: 92,
	REQ_TARGET_IF_AVAILABLE_AND_HAS_OVERLOADED_MANA: 93,
	REQ_TARGET_IF_AVAILABLE_AND_HERO_ATTACKED_THIS_TURN: 94,
	REQ_TARGET_IF_AVAILABLE_AND_DRAWN_THIS_TURN: 95,
	REQ_TARGET_IF_AVAILABLE_AND_NOT_DRAWN_THIS_TURN: 96,
	REQ_TARGET_NON_TRIPLED_MINION: 97,
	REQ_BOUGHT_MINION_THIS_TURN: 98,
	REQ_SOLD_MINION_THIS_TURN: 99,
	REQ_TARGET_IF_AVAILABLE_AND_PLAYER_HEALTH_CHANGED_THIS_TURN: 100,
	REQ_TARGET_IF_AVAILABLE_AND_SOUL_FRAGMENT_IN_DECK: 101,
	REQ_DAMAGED_TARGET_UNLESS_COMBO: 102,
	REQ_NOT_MINION_DORMANT: 103,
	REQ_TARGET_NOT_DORMANT: 104,
	REQ_TARGET_IF_AVAILABLE_AND_BOUGHT_RACE_THIS_TURN: 105,
	REQ_TARGET_IF_AVAILABLE_AND_SOLD_RACE_THIS_TURN: 106,
	REQ_NOT_IN_COOLDOWN: 107,
	REQ_TARGET_IS_MERC: 108,
	REQ_TARGET_IS_NON_MERC: 109,
	REQ_TWO_OF_A_KIND: 110,
	REQ_LETTUCE_ABILITY_CANNOT_TARGET_OWNER: 112,
	REQ_TARGET_NOT_HAVE_TAG: 116,
	REQ_TARGET_MUST_HAVE_TAG: 117,
	REQ_DRAG_TO_PLAY: 999,
};

export class OptionsHandler {
	static Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		stateType: StateType,
		stateFacade: StateFacade,
		helper: Helper,
	): void {
		if (state.CurrentGame == null || state.Node == null) {
			return;
		}

		if (stateType === StateType.PowerTaskList && state.ReconnectionOngoing) {
			state.ReconnectionOngoing = false;
			stateFacade.GsState!.ReconnectionOngoing = false;
			state.NodeParser.EnqueueGameEvent([
				GameEventProvider.Create(
					timestamp,
					'RECONNECT_OVER',
					() => ({
						Type: 'RECONNECT_OVER',
					}),
					false,
					new Node(null as any, null, 0, null, data),
				),
			]);
		}

		data = data.trim();
		let match = Regexes.OptionsEntityRegex.exec(data);
		if (match) {
			const id = match[1];
			const options = new Options();
			options.Id = parseInt(id, 10);
			options.OptionList = [];
			options.TimeStamp = timestamp;
			state.Options = options;

		if (false && stateType === StateType.GameState && !stateFacade.IsBattlegrounds()) {
			if (state.Node!.Type !== MetaData) {
				stateFacade.NotifyUpdateToRootNeeded();
				state.UpdateCurrentNode(Game);
				if (state.Node!.Type === Game) {
					(state.Node!.Object as Game).AddData(state.Options!);
				} else {
					throw new Error('Invalid node ' + state.Node!.Type + ' -- ' + data);
				}
			}
		} else {
				state.CurrentGame.AddData(state.Options);
			}
			return;
		}
		match = Regexes.OptionsOptionRegex.exec(data);
		if (match) {
			const index = match[1];
			const rawType = match[2];
			const rawEntity = match[3];
			const rawError = match[4];

			const entity = helper.ParseEntity(rawEntity);
			const type = helper.ParseEnum(OptionTypeEnum, rawType);
			const error = helper.ParseEnum(PlayReqEnum, rawError);

			const option = new Option();
			option.Entity = entity;
			option.Index = parseInt(index, 10);
			option.Type = type;
			option.Error = error;
			option.OptionItems = [];
			state.Options!.OptionList.push(option);
			state.CurrentOption = option;
			state.LastOption = option;
			return;
		}

		match = Regexes.OptionsSuboptionRegex.exec(data);
		if (match) {
			const subOptionType = match[1];
			const index = match[2];
			const rawEntity = match[3];
			const entity = helper.ParseEntity(rawEntity);

			if (subOptionType === 'subOption') {
				const subOption = new SubOption();
				subOption.Entity = entity;
				subOption.Index = parseInt(index, 10);
				subOption.Targets = [];
				state.CurrentOption!.OptionItems.push(subOption);
				state.LastOption = subOption;
			} else if (subOptionType === 'target') {
				const target = new Target();
				target.Entity = entity;
				target.Index = parseInt(index, 10);
				if (state.LastOption instanceof Option) {
					state.LastOption.OptionItems.push(target);
					return;
				}
				if (state.LastOption instanceof SubOption) {
					state.LastOption.Targets.push(target);
				}
			} else {
				throw new Error('Unexpected suboption type: ' + subOptionType);
			}
		}
	}
}
