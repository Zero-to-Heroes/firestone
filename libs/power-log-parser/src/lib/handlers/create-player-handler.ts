import { Game, Node, NodeType, PlayerEntity, Tag } from '../models';
import { Regexes } from '../regexes';
import type { ParserState } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class CreatePlayerHandler {
	static Handle(data: string, state: ParserState, stateFacade: StateFacade, indentLevel: number): boolean {
		const match = Regexes.ActionCreategamePlayerRegex.exec(data);
		if (!state.ReconnectionOngoing && match) {
			const id = match[1];
			const playerId = match[2];
			const accountHi = match[3];
			const accountLo = match[4];
			const gsPlayer = stateFacade.GetPlayers()?.find((p) => p.Id === parseInt(id, 10));
			const pEntity = new PlayerEntity();
			pEntity.Id = parseInt(id, 10);
			pEntity.AccountHi = accountHi;
			pEntity.AccountLo = accountLo;
			pEntity.PlayerId = parseInt(playerId, 10);
			pEntity.InitialName = gsPlayer?.InitialName ?? '';
			pEntity.Name = gsPlayer?.Name ?? '';
			pEntity.Tags = [];
			pEntity.IsMainPlayer = gsPlayer?.IsMainPlayer ?? false;
			pEntity.Cardback = gsPlayer?.Cardback ?? '';
			pEntity.LegendRank = gsPlayer?.LegendRank ?? '';
			pEntity.Rank = gsPlayer?.Rank ?? '';

			state.UpdateCurrentNode(NodeType.Game);
			state.CurrentGame.AddData(pEntity);
			state.RegisterEntityForIndex(pEntity);

			const newNode = new Node(NodeType.PlayerEntity, pEntity, indentLevel, state.Node, data);
			state.CreateNewNode(newNode);
			state.Node = newNode;
			return true;
		}
		return false;
	}
}
