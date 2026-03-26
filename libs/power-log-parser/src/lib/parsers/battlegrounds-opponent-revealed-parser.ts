import { CardIds, CardType, GameTag, GameType, Zone } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEvent, GameEventProvider } from '../game-event';
import { FullEntity, Node, NodeType } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const EXCLUDED_HERO_CREATOR_DBFIDS: number[] = [63600];

export class BattlegroundsOpponentRevealedParser implements ActionParser {
	readonly ParserName = 'BattlegroundsOpponentRevealedParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	AppliesOnCloseNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === NodeType.FullEntity &&
			(node.Object as FullEntity).GetTag(GameTag.ZONE) === (Zone.SETASIDE as number) &&
			(node.Object as FullEntity).GetTag(GameTag.CARDTYPE) === (CardType.HERO as number)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const fullEntity = node.Object as FullEntity;
		const cardId = fullEntity.CardId;
		if (
			cardId === CardIds.BaconphheroHeroic ||
			cardId === CardIds.TagtransferplayerenchantDntEnchantment_Bacon_TagTransferPlayerE
		) {
			return null;
		}

		const result: GameEventProvider[] = [];
		result.push(
			GameEventProvider.Create(
				fullEntity.TimeStamp,
				'BATTLEGROUNDS_OPPONENT_REVEALED',
				() => this.buildGameEvent(node),
				false,
				node,
			),
		);
		if (
			this.GameState.NextBgsOpponentPlayerId > 0 &&
			fullEntity.GetTag(GameTag.PLAYER_ID) === this.GameState.NextBgsOpponentPlayerId &&
			!EXCLUDED_HERO_CREATOR_DBFIDS.includes(fullEntity.GetTag(GameTag.CREATOR_DBID))
		) {
			result.push(
				GameEventProvider.Create(
					fullEntity.TimeStamp,
					'BATTLEGROUNDS_NEXT_OPPONENT',
					() => {
						if (!this.StateFacade.IsBattlegrounds()) {
							return null;
						}
						return {
							Type: 'BATTLEGROUNDS_NEXT_OPPONENT',
							Value: {
								CardId: cardId,
								OpponentPlayerId: fullEntity.GetTag(GameTag.PLAYER_ID),
								LeaderboardPlace: fullEntity.GetLeaderboardPosition(
									this.StateFacade.GetMetaData().GameType as GameType,
								),
							},
						};
					},
					true,
					node,
				),
			);
			this.GameState.BgsHasSentNextOpponent = true;
			this.GameState.NextBgsOpponentPlayerId = -1;
		}
		return result;
	}

	private buildGameEvent(node: Node): GameEvent | null {
		const fullEntity = node.Object as FullEntity;
		const cardId = fullEntity.CardId;
		if (!this.StateFacade.IsBattlegrounds()) {
			return null;
		}

		if (this.StateFacade.OpponentPlayer?.PlayerId !== fullEntity.GetEffectiveController()) {
			return null;
		}

		if (fullEntity.GetTag(GameTag.BACON_IS_KEL_THUZAD) === 1) {
			return null;
		}

		return {
			Type: 'BATTLEGROUNDS_OPPONENT_REVEALED',
			Value: {
				CardId: cardId,
				PlayerId: fullEntity.GetTag(GameTag.PLAYER_ID),
				LeaderboardPlace: fullEntity.GetLeaderboardPosition(
					this.StateFacade.GetMetaData().GameType as GameType,
				),
				Health: fullEntity.GetTag(GameTag.HEALTH),
				Armor: fullEntity.GetTag(GameTag.ARMOR),
			},
		};
	}
}
