import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { GameEntity, Node, NodeType } from '../models';
import { ParserState, StateType } from '../state/parser-state';

export class BattlegroundsTavernPrizesParser implements ActionParser {
	readonly ParserName = 'BattlegroundsTavernPrizesParser';

	constructor(_parserState: ParserState) {}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return stateType === StateType.PowerTaskList && node.Type === NodeType.GameEntity;
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const gameEntity = node.Object as GameEntity;
		return [
			GameEventProvider.Create(
				gameEntity.TimeStamp,
				'GAME_SETTINGS',
				() => ({
					Type: 'GAME_SETTINGS',
					Value: {
						BattlegroundsPrizes:
							gameEntity.GetTag(GameTag.DARKMOON_FAIRE_PRIZES_ACTIVE) === 1,
						BattlegroundsSpells: true,
						BattlegroundsQuests:
							gameEntity.GetTag(GameTag.BACON_QUESTS_ACTIVE) === 1,
						BattlegroundsBuddies:
							gameEntity.GetTag(GameTag.BACON_BUDDY_ENABLED) === 1,
						BattlegroundsTrinkets:
							gameEntity.GetTag(GameTag.BACON_TRINKETS_ACTIVE) === 1,
						BattlegroundsAnomalies: [
							gameEntity.GetTag(GameTag.BACON_GLOBAL_ANOMALY_DBID),
						],
						BattlegroundsTimewarped:
							gameEntity.GetTag(GameTag.BACON_ALT_TAVERN_SYSTEM_ACTIVE) === 1,
					},
				}),
				false,
				node,
			),
		];
	}
}
