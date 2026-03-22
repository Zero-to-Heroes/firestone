import { GameTag, PlayState } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, PlayerEntity, TagChange } from '../models';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

export class WinnerParser implements ActionParser {
	readonly ParserName = 'WinnerParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			((node.Object as TagChange).Name === (GameTag.PLAYSTATE as number) ||
				(this.ParserState.IsBattlegrounds() &&
					(node.Object as TagChange).Name ===
						(GameTag.TAG_PLAYER_CONCEDED_OR_DISCONNECTED as number)))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		const tagChange = node.Object as TagChange;
		if (
			tagChange.Name === (GameTag.PLAYSTATE as number) &&
			tagChange.Value === (PlayState.WON as number)
		) {
			const winner = this.ParserState.GetEntity(tagChange.Entity) as PlayerEntity | undefined;
			if (winner == null) {
				return null;
			}

			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'WINNER',
					() => ({
						Type: 'WINNER',
						Value: {
							Winner: winner,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
						},
					}),
					true,
					node,
				),
			];
		} else if (
			tagChange.Name === (GameTag.PLAYSTATE as number) &&
			tagChange.Value === (PlayState.TIED as number)
		) {
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'TIE',
					() => ({
						Type: 'TIE',
					}),
					true,
					node,
				),
			];
		} else if (tagChange.Name === (GameTag.TAG_PLAYER_CONCEDED_OR_DISCONNECTED as number)) {
			const isPlayer = tagChange.Entity === this.StateFacade.LocalPlayer?.Id;
			if (!isPlayer) {
				return null;
			}
			return [
				GameEventProvider.Create(
					tagChange.TimeStamp,
					'WINNER',
					() => ({
						Type: 'WINNER',
						Value: {
							Winner: this.StateFacade.OpponentPlayer,
							LocalPlayer: this.StateFacade.LocalPlayer,
							OpponentPlayer: this.StateFacade.OpponentPlayer,
						},
					}),
					true,
					node,
				),
			];
		}
		return null;
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
