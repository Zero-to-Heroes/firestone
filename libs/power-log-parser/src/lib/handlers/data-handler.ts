import type { Helper } from '../helper';
import type { GameMetaData } from '../state/game-meta-data';
import type { ParserState, StateType } from '../state/parser-state';
import type { StateFacade } from '../state/state-facade';

import { BlockEndHandler } from './block-end-handler';
import { BlockStartHandler } from './block-start-handler';
import { ChangeEntityHandler } from './change-entity-handler';
import { FullEntityHandler } from './full-entity-handler';
import { HideEntityHandler } from './hide-entity-handler';
import { MetaDataHandler } from './meta-data-handler';
import { NewGameHandler } from './new-game-handler';
import { ShowEntityHandler } from './show-entity-handler';
import { SpectatorHandler } from './spectator-handler';
import { SubSpellHandler } from './sub-spell-handler';
import { TagChangeHandler } from './tag-change-handler';
import { TagHandler } from './tag-handler';
import { ShuffleDeckHandler } from './shuffle-deck-handler';
import { CreateGameHandler } from './create-game-handler';
import { CreatePlayerHandler } from './create-player-handler';
import { PlayerNameHandler } from './player-name-handler';
import { ActionMetadataHandler } from './action-metadata-handler';
import { ActionMetadataInfoHandler } from './action-metadata-info-handler';

type HandlerFn = (
	timestamp: string,
	data: string,
	state: ParserState,
	stateType: StateType,
	facade: StateFacade,
	indent: number,
) => boolean;

export class DataHandler {
	private readonly helper: Helper;
	private readonly metadata: GameMetaData = { BuildNumber: 0, FormatType: 0, GameType: 0, ScenarioID: 0 };
	private readonly handlers: [string, HandlerFn][];

	constructor(helper: Helper) {
		this.helper = helper;

		this.handlers = [
			['GameEntity EntityID=', (ts, d, s, st, f, i) => CreateGameHandler.Handle(ts, d, s, i)],
			['PlayerID=', (ts, d, s, st, f, i) => PlayerNameHandler.Handle(ts, d, s, st)],
			['Player EntityID=', (ts, d, s, st, f, i) => CreatePlayerHandler.Handle(d, s, f, i)],
			['BLOCK_START', (ts, d, s, st, f, i) => BlockStartHandler.Handle(ts, d, s, i, this.helper)],
			['BLOCK_END', (ts, d, s, st, f, i) => BlockEndHandler.Handle(d, s)],
			['BuildNumber=', (ts, d, s, st, f, i) => MetaDataHandler.Handle(ts, d, s, st, this.metadata, this.helper)],
			['GameType=', (ts, d, s, st, f, i) => MetaDataHandler.Handle(ts, d, s, st, this.metadata, this.helper)],
			['FormatType=', (ts, d, s, st, f, i) => MetaDataHandler.Handle(ts, d, s, st, this.metadata, this.helper)],
			['ScenarioID=', (ts, d, s, st, f, i) => MetaDataHandler.Handle(ts, d, s, st, this.metadata, this.helper)],
			['TAG_CHANGE', (ts, d, s, st, f, i) => TagChangeHandler.Handle(ts, d, s, st, f, i, this.helper)],
			['tag=', (ts, d, s, st, f, i) => TagHandler.Handle(ts, d, s, this.helper)],
			['SHUFFLE_DECK', (ts, d, s, st, f, i) => ShuffleDeckHandler.Handle(ts, d, s, i)],
			['FULL_ENTITY', (ts, d, s, st, f, i) => FullEntityHandler.Handle(ts, d, s, i, this.helper)],
			['SHOW_ENTITY', (ts, d, s, st, f, i) => ShowEntityHandler.Handle(ts, d, s, i, this.helper)],
			['CHANGE_ENTITY', (ts, d, s, st, f, i) => ChangeEntityHandler.Handle(ts, d, s, i, this.helper)],
			['HIDE_ENTITY', (ts, d, s, st, f, i) => HideEntityHandler.Handle(ts, d, s, i, this.helper)],
			['SUB_SPELL_START', (ts, d, s, st, f, i) => SubSpellHandler.Handle(ts, d, s, st, f, this.helper)],
			['Source =', (ts, d, s, st, f, i) => SubSpellHandler.Handle(ts, d, s, st, f, this.helper)],
			['Targets', (ts, d, s, st, f, i) => SubSpellHandler.Handle(ts, d, s, st, f, this.helper)],
			['SUB_SPELL_END', (ts, d, s, st, f, i) => SubSpellHandler.Handle(ts, d, s, st, f, this.helper)],
			['META_DATA', (ts, d, s, st, f, i) => ActionMetadataHandler.Handle(ts, d, s, i, this.helper)],
			['Info', (ts, d, s, st, f, i) => ActionMetadataInfoHandler.Handle(ts, d, s, i, this.helper)],
		];
	}

	Handle(
		timestamp: string,
		data: string,
		state: ParserState,
		stateType: StateType,
		previousTimestamp: string,
		stateFacade: StateFacade,
		currentGameSeed: number,
		resettingGame: boolean,
	): void {
		const trimmed = data.trim();
		const indentLevel = data.length - trimmed.length;
		data = trimmed;

		if (NewGameHandler.Handle(timestamp, data, state, previousTimestamp, stateType, stateFacade, currentGameSeed, resettingGame, this.metadata, this.helper)) {
			return;
		} else if (data.includes('Begin Spectating') || data.includes('End Spectator Mode')) {
			SpectatorHandler.Handle(timestamp, data, state, stateFacade);
			return;
		}

		if (state.Node != null) {
			for (const [key, handler] of this.handlers) {
				if (data.startsWith(key)) {
					if (handler(timestamp, data, state, stateType, stateFacade, indentLevel)) {
						return;
					}
				}
			}
		}

		if (state.Ended || state.CurrentGame == null) {
			return;
		}
	}
}
