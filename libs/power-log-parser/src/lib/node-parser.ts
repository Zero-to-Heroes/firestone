import { Node } from './models';
import { GameEventProvider } from './game-event';
import { EventQueueHandler } from './event-queue-handler';
import { ControlsManager } from './controls/controls-manager';
import { Logger } from './logger';
import type { ActionParser } from './action-parser';
import type { StateFacade } from './state/state-facade';
import type { ParserState } from './state/parser-state';
import { StateType, INodeParser } from './state/parser-state';

export class NodeParser implements INodeParser {
	private QueueHandler: EventQueueHandler;
	private StateFacade: StateFacade;
	private ParserState!: ParserState;
	private StateType: StateType;
	private Controller: ControlsManager;

	private _parsers: ActionParser[] | null = null;
	private get parsers(): ActionParser[] {
		if (this._parsers != null) {
			return this._parsers;
		}
		if (this.ParserState == null) {
			return [];
		}
		if (
			this.StateFacade?.GsState?.CurrentGame?.GameType == null ||
			this.ParserState == null ||
			this.StateFacade?.GsState?.CurrentGame?.GameType === -1
		) {
			return this.BuildActionParsers(this.ParserState, this.StateType);
		}
		const allParsers = this.BuildActionParsers(this.ParserState, this.StateType);
		this._parsers = allParsers.filter((p) => this.Controller.Applies(p));
		return this._parsers;
	}

	constructor(queueHandler: EventQueueHandler, stateFacade: StateFacade, stateType: StateType) {
		this.QueueHandler = queueHandler;
		this.StateFacade = stateFacade;
		this.StateType = stateType;
		this.Controller = new ControlsManager(stateFacade, stateType);
	}

	Reset(parserState: ParserState, helper: StateFacade): void {
		this.StateFacade = helper;
		this.ParserState = parserState;
		this.QueueHandler.Reset(helper);
		this._parsers = null;
	}

	NewNode(node: Node, stateType: StateType): void {
		if (node == null) {
			return;
		}
		for (const parser of this.parsers) {
			if (parser.AppliesOnNewNode(node, stateType)) {
				try {
					const providers = parser.CreateGameEventProviderFromNew(node);
					if (providers != null) {
						this.EnqueueGameEvent(providers);
					}
				} catch (e: any) {
					Logger.Log('ERROR: Exception while parsing node', e?.message ?? e);
					Logger.Log(node.CreationLogLine ?? '', '');
					Logger.Log(e?.stack ?? '', '');
				}
			}
		}
	}

	CloseNode(node: Node, stateType: StateType): void {
		if (node == null) {
			return;
		}
		for (const parser of this.parsers) {
			if (!node.Closed && parser.AppliesOnCloseNode(node, stateType)) {
				try {
					const providers = parser.CreateGameEventProviderFromClose(node);
					if (providers != null && providers.length > 0) {
						this.EnqueueGameEvent(providers);
					}
				} catch (e: any) {
					Logger.Log('ERROR: Exception while parsing node', e?.message ?? e);
					Logger.Log(node.CreationLogLine ?? '', '');
					Logger.Log(e?.stack ?? '', '');
				}
			}
		}
		node.Closed = true;
	}

	EnqueueGameEvent(providers: GameEventProvider[]): void {
		this.QueueHandler.EnqueueGameEvent(providers);
	}

	ClearQueue(): void {
		this.QueueHandler.ClearQueue();
	}

	// Phase 2 will populate this with the full list of ~133 ActionParser implementations.
	// For now returns empty; the infrastructure is fully wired and ready.
	private BuildActionParsers(_parserState: ParserState, _stateType: StateType): ActionParser[] {
		return [];
	}
}
