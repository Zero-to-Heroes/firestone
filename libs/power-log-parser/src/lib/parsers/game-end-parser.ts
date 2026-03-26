import { GameTag } from '@firestone-hs/reference-data';
import { ActionParser } from '../action-parser';
import { GameEventProvider } from '../game-event';
import { Node, TagChange } from '../models';
import { Logger } from '../logger';
import { xmlFromReplay } from '../replay-converter';
import { GameState } from '../state/game-state';
import { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

const STATE_COMPLETE = 3;

export class GameEndParser implements ActionParser {
	readonly ParserName = 'GameEndParser';

	private GameState: GameState;
	private ParserState: ParserState;
	private StateFacade: StateFacade;

	constructor(parserState: ParserState, stateFacade: StateFacade) {
		this.ParserState = parserState;
		this.GameState = parserState.GameState;
		this.StateFacade = stateFacade;
	}

	AppliesOnNewNode(node: Node, stateType: StateType): boolean {
		let tagChange: TagChange | null = null;
		return (
			stateType === StateType.PowerTaskList &&
			node.Type === TagChange &&
			(((tagChange = node.Object as TagChange).Name === (GameTag.STATE as number) &&
				tagChange.Value === STATE_COMPLETE) ||
				(this.ParserState.IsBattlegrounds() &&
					tagChange!.Name === (GameTag.TAG_PLAYER_CONCEDED_OR_DISCONNECTED as number) &&
					tagChange!.Value === 1))
		);
	}

	AppliesOnCloseNode(_node: Node, _stateType: StateType): boolean {
		return false;
	}

	CreateGameEventProviderFromNew(node: Node): GameEventProvider[] | null {
		Logger.Log('Parsing end game', node.CreationLogLine);
		const tagChange = node.Object as TagChange;
		if (tagChange.Name === (GameTag.TAG_PLAYER_CONCEDED_OR_DISCONNECTED as number)) {
			const isPlayer = tagChange.Entity === this.StateFacade.LocalPlayer?.Id;
			if (!isPlayer) {
				return null;
			}
		}

		for (const player of this.ParserState.getPlayers()) {
			const gsPlayer = this.StateFacade.GetPlayers().find((p) => p.Id === player.Id);
			player.Name = gsPlayer?.Name ?? player.Name;
		}

		const gameStateReport = this.GameState.BuildGameStateReport(this.StateFacade);
		Logger.Log('gameStateReport built', '');

		let replayXml: string | null = null;
		try {
			Logger.Log('Will convert to xml', '');
			replayXml = xmlFromReplay(this.StateFacade.GSReplay);
			Logger.Log('XML converted', '');
		} catch (ex) {
			Logger.Log('Could not convert replay to xml', `${ex}`);
		}

		Logger.Log('Enqueuing GAME_END event', '');
		this.ParserState.EndCurrentGame();
		return [
			GameEventProvider.Create(
				tagChange.TimeStamp,
				'GAME_END',
				() => ({
					Type: 'GAME_END',
					Value: {
						LocalPlayer: this.StateFacade.LocalPlayer,
						OpponentPlayer: this.StateFacade.OpponentPlayer,
						GameStateReport: gameStateReport,
						ReplayXml: replayXml,
						FormatType: this.ParserState.CurrentGame.FormatType,
						GameType: this.ParserState.CurrentGame.GameType,
						ScenarioID: this.ParserState.CurrentGame.ScenarioID,
						Spectating: this.StateFacade.Spectating,
					},
				}),
				true,
				node,
			),
		];
	}

	CreateGameEventProviderFromClose(_node: Node): GameEventProvider[] | null {
		return null;
	}
}
