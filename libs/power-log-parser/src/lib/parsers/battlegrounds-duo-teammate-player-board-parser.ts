import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, NodeType, Player, SubSpell } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';
import {
	BattlegroundsPlayerBoardParser,
	PlayerBoard,
} from './battlegrounds-player-board-parser';

export class BattlegroundsDuoTeammatePlayerBoardParser implements ActionParser {
	readonly ParserName = 'BattlegroundsDuoTeammatePlayerBoardParser';

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
			stateType === StateType.GameState &&
			this.StateFacade.IsBattlegrounds() &&
			(this.GameState.GetGameEntity()?.GetTag(GameTag.BOARD_VISUAL_STATE) ?? 0) === 2 &&
			node.Type === NodeType.SubSpell &&
			(node.Object as SubSpell).Prefab.startsWith(
				'ReuseFX_Generic_OverrideSpawn_FromPortal_Super_Random_SuppressPlaySounds',
			)
		);
	}

	CreateGameEventProviderFromNew(_node: Node): GameEventProvider[] | null {
		return null;
	}

	CreateGameEventProviderFromClose(node: Node): GameEventProvider[] | null {
		const subSpell = node.Object as SubSpell;
		const opponent = this.StateFacade.OpponentPlayer!;
		const player = this.StateFacade.LocalPlayer!;

		const opponentBoard = BattlegroundsPlayerBoardParser.CreateProviderFromAction(
			opponent.PlayerId,
			opponent.Id,
			true,
			player,
			this.GameState,
			this.StateFacade,
		);
		const playerBoard = BattlegroundsPlayerBoardParser.CreateProviderFromAction(
			player.PlayerId,
			player.Id,
			false,
			player,
			this.GameState,
			this.StateFacade,
		);

		this.GameState.BgsHasSentNextOpponent = false;

		return [
			GameEventProvider.Create(
				subSpell.Timestamp,
				'BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD',
				() => {
					this.EnhanceInfo(playerBoard, player, this.GameState, this.StateFacade);
					this.EnhanceInfo(opponentBoard, opponent, this.GameState, this.StateFacade);
					return {
						Type: 'BATTLEGROUNDS_DUO_FUTURE_TEAMMATE_BOARD',
						Value: {
							Timestamp: subSpell.Timestamp,
							PlayerBoard: playerBoard,
							OpponentBoard: opponentBoard,
						},
					};
				},
				true,
				node,
			),
		];
	}

	private EnhanceInfo(
		playerBoard: PlayerBoard | null,
		player: Player,
		gameState: GameState,
		stateFacade: StateFacade,
	): void {
		if (playerBoard == null) return;
		this.EnhanceHeroPower(playerBoard);
		const globalInfoFuture = BattlegroundsPlayerBoardParser.BuildGlobalInfo(
			player.PlayerId,
			playerBoard.PlayerEntityId,
			playerBoard.Board,
			gameState,
			stateFacade,
		);
		playerBoard.GlobalInfo.ChoralAttackBuff = globalInfoFuture.ChoralAttackBuff;
		playerBoard.GlobalInfo.ChoralHealthBuff = globalInfoFuture.ChoralHealthBuff;
	}

	private EnhanceHeroPower(playerBoard: PlayerBoard): void {
		BattlegroundsPlayerBoardParser.UpdateEmbraceYourRageTarget(this.StateFacade, playerBoard.HeroPowers);
		BattlegroundsPlayerBoardParser.UpdateRebornRitesTarget(this.StateFacade, playerBoard.HeroPowers);
		BattlegroundsPlayerBoardParser.UpdateLockAndLoadMinion(this.StateFacade, playerBoard.HeroPowers);
	}
}
