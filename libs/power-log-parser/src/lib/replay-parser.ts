import { BlockType, GameType } from '@firestone-hs/reference-data';
import { BehaviorSubject } from 'rxjs';
import { EventQueueHandler } from './event-queue-handler';
import { GameEvent, GameEventProvider } from './game-event';
import { GameEventHandler } from './game-event-handler';
import { ChoicesHandler } from './handlers/choices-handler';
import { DataHandler } from './handlers/data-handler';
import { EntityChosenHandler } from './handlers/entity-chosen-handler';
import { OptionsHandler } from './handlers/options-handler';
import { PowerDataHandler } from './handlers/power-data-handler';
import { PowerProcessorHandler } from './handlers/power-processor-handler';
import { Helper } from './helper';
import { Logger } from './logger';
import { HearthstoneReplay, Node } from './models';
import { NodeParser } from './node-parser';
import { Regexes } from './regexes';
import { RewindCardOracle, buildRewindCardOracle } from './rewind/card-oracle';
import { LogStream, RewindController } from './rewind/rewind-controller';
import { ParserSnapshotMeta } from './rewind/snapshot';
import { CombinedState } from './state/combined-state';
import { GameState } from './state/game-state';
import { INodeParser, StateType } from './state/parser-state';
import { StateFacade } from './state/state-facade';

export { GameEvent } from './game-event';
export { RewindCardOracle, buildRewindCardOracle } from './rewind/card-oracle';

export interface PtlGameStateUpdate {
	readonly gameState: GameState;
	readonly localPlayerId: number;
	readonly opponentPlayerId: number;
}

/**
 * Classify the origin of a BLOCK_START from its raw `Entity=...` clause. Rewind only applies to
 * *card* entities - TRIGGER blocks whose origin is `GameEntity` / a player / a bare number can
 * never carry a REWIND mechanic, so we need to distinguish "this isn't a card" from "this is a
 * card whose cardId hasn't been revealed yet".
 *
 *  - Returns `{ kind: 'card', cardId: 'XYZ_001' }` when the entity has a non-empty `cardId=`.
 *  - Returns `{ kind: 'card', cardId: null }` when the entity has `cardId=` with an empty value
 *    (typical for opponent's hand cards that haven't been revealed yet).
 *  - Returns `null` otherwise (the entity is GameEntity / player / numeric-only; never rewind).
 */
function classifyBlockOrigin(rawEntity: string): { kind: 'card'; cardId: string | null } | null {
	if (!rawEntity) return null;
	// A card-like entity always has the `[... cardId=... ]` shape. GameEntity / UNKNOWN HUMAN
	// PLAYER / bare numeric IDs will not match this.
	const m = /cardId=([^\s\]]*)/.exec(rawEntity);
	if (!m) return null;
	const id = m[1].trim();
	return { kind: 'card', cardId: id.length === 0 ? null : id };
}

export class ReplayParser {
	static start: string = '';

	State: CombinedState;
	readonly ptlGameState$ = new BehaviorSubject<PtlGameStateUpdate | null>(null);

	private dataHandler: DataHandler;
	private powerDataHandler: PowerDataHandler;
	private helper: Helper;
	private gameEventHandler: GameEventHandler;

	private previousTimestamp: string = '';
	private CurrentGameSeed: number = 0;

	private _onGameEvent: ((event: GameEvent) => void) | null = null;
	get onGameEvent(): ((event: GameEvent) => void) | null {
		return this._onGameEvent;
	}
	set onGameEvent(handler: ((event: GameEvent) => void) | null) {
		this._onGameEvent = handler;
		this.gameEventHandler.onEvent = handler;
	}

	/**
	 * Reference-data lookup for the rewind machinery. When omitted (or null), the parser treats
	 * every BLOCK_START as non-rewind-capable - existing callers that don't need rewind handling
	 * (debug tooling, parity specs) can keep using `new ReplayParser()`.
	 */
	private readonly cardOracle: RewindCardOracle;
	private readonly rewindController: RewindController;

	// GAME_RESET block state per stream. When `insideGameResetX` is true we swallow every line
	// on that stream until we see the matching BLOCK_END - the snapshot restore has already
	// produced the desired state, so the FULL_ENTITY children inside the GAME_RESET block are
	// redundant (and dispatching their events would be incorrect since consumers are already
	// being reset via REWIND_STARTED).
	private insideGameResetGS = false;
	private insideGameResetPTL = false;
	private rewindOriginGS: number | null = null;
	private rewindOriginPTL: number | null = null;

	/**
	 * When we detect a GAME_RESET BLOCK_START but have no matching snapshot (unexpected: the
	 * rewind-capable trigger was missed upstream), we fall back to the legacy behaviour:
	 * GameResetParser's `PartialReset()` + normal FULL_ENTITY dispatch. In that case we do
	 * NOT set `insideGameResetX` and instead let AddData flow through.
	 */
	private fallbackLegacyGameResetGS = false;
	private fallbackLegacyGameResetPTL = false;

	constructor(cardOracle: RewindCardOracle | null = null) {
		this.gameEventHandler = new GameEventHandler();
		this.State = new CombinedState(this.createNodeParser.bind(this));
		this.helper = new Helper(this.State);
		this.dataHandler = new DataHandler(this.helper);
		this.powerDataHandler = new PowerDataHandler(this.helper);
		this.previousTimestamp = '';
		this.cardOracle = cardOracle ?? buildRewindCardOracle(null);
		this.rewindController = new RewindController(this.State, this.cardOracle, {
			onRewindCapableActionStart: (meta) => this.emitRewindCapableActionStart(meta),
		});
		ReplayParser.start = new Date().toISOString();
		Logger.Log('ReplayParser constructor over', this.State.GSState == null);
	}

	private createNodeParser(stateFacade: StateFacade, stateType: StateType): INodeParser {
		const queueHandler = new EventQueueHandler(stateFacade, (event) => this.gameEventHandler.Handle(event));
		return new NodeParser(queueHandler, stateFacade, stateType);
	}

	FromString(lines: readonly string[], ...gameTypes: GameType[]): HearthstoneReplay {
		this.Read([...lines]);
		const finalState = this.State.GSState;
		for (let i = 0; i < finalState.Replay.Games.length; i++) {
			if (gameTypes == null || gameTypes.length === 1) {
				finalState.Replay.Games[i].Type = gameTypes[0] as number;
			} else {
				finalState.Replay.Games[i].Type = gameTypes.length > i ? (gameTypes[i] as number) : 0;
			}
		}
		return finalState.Replay;
	}

	Read(lines: string[]): void {
		this.Init();
		const gameSeed = this.ExtractGameSeed(lines);
		Logger.Log(`Extracted game seed = ${gameSeed}`, '');
		if (gameSeed > 0) {
			this.CurrentGameSeed = gameSeed;
		}

		for (let i = 0; i < lines.length; i++) {
			this.ReadLine(lines[i], this.CurrentGameSeed, i);
		}
		this.State.GSState.NodeParser.ClearQueue();
		this.State.PTLState.NodeParser.ClearQueue();
	}

	Init(): void {
		Logger.Log('Calling reset from ReplayParser.init()', '');
		this.previousTimestamp = '';
	}

	ReadLine(line: string, gameSeed: number, lineIndex: number): void {
		if (gameSeed !== 0) {
			this.CurrentGameSeed = gameSeed;
		}

		// A fresh CREATE_GAME wipes the rewind controller - nothing from a prior match should
		// be reachable (retained snapshots, parked PTL halves, depth trackers).
		if (line.includes('GameState') && line.includes('CREATE_GAME')) {
			this.rewindController.reset();
			this.insideGameResetGS = false;
			this.insideGameResetPTL = false;
			this.rewindOriginGS = null;
			this.rewindOriginPTL = null;
			this.fallbackLegacyGameResetGS = false;
			this.fallbackLegacyGameResetPTL = false;
		}

		let timestamp: string | null = null;
		let method: string | null = null;
		let content: string | null = null;
		let matchSuccess = false;

		if (line.length >= 3 && line[0] === 'D' && line[1] === ' ') {
			const timestampStart = 2;
			const timestampEnd = line.indexOf(' ', timestampStart);
			if (timestampEnd > timestampStart) {
				timestamp = line.substring(timestampStart, timestampEnd);
				const methodEnd = line.indexOf('() - ', timestampEnd + 1);
				if (methodEnd > timestampEnd) {
					method = line.substring(timestampEnd + 1, methodEnd);
					content = line.substring(methodEnd + 5);
					matchSuccess = true;
				}
			}
		}

		const isGameState = line.includes('GameState.');
		const isPowerTaskList = line.includes('PowerTaskList.');
		const stream: LogStream | null = isGameState ? 'GS' : isPowerTaskList ? 'PTL' : null;
		const normalizedTimestamp = matchSuccess ? this.NormalizeTimestamp(timestamp!) : new Date().toISOString();

		// --- Rewind controller observers --------------------------------------------------
		// All of these are cheap no-ops when the line isn't a block boundary / SHOW_ENTITY.
		if (stream !== null) {
			this.observeRewindEvents(stream, line, normalizedTimestamp);
		}

		// --- Skip lines inside an actively-being-rewound GAME_RESET block -----------------
		// We still want to forward the line to the normal parsing path if we're in legacy
		// fallback mode (no snapshot was available, so GameResetParser must run).
		if (stream === 'GS' && this.insideGameResetGS && !this.fallbackLegacyGameResetGS) {
			return;
		}
		if (stream === 'PTL' && this.insideGameResetPTL && !this.fallbackLegacyGameResetPTL) {
			return;
		}

		if (!matchSuccess) {
			if (line.includes('End Spectator Mode') || (line.includes('Begin Spectating') && !line.includes('2nd'))) {
				this.AddData('', 'Spectator', line, gameSeed);
			} else if (line != null && line.trim().length > 0) {
				Logger.Log('No match', line);
			}
			return;
		}

		this.AddData(timestamp!, method!, content!, gameSeed);
	}

	/**
	 * Handle the structural events that drive the rewind snapshot/restore lifecycle. Split
	 * out of ReadLine for readability - the line parsing / dispatch logic is orthogonal.
	 */
	private observeRewindEvents(stream: LogStream, line: string, normalizedTimestamp: string): void {
		const hasBlockStart = line.includes('BLOCK_START');
		const hasBlockEnd = !hasBlockStart && line.includes('BLOCK_END');

		if (hasBlockStart) {
			// Regex is anchored at end-of-line; game client tends to emit a trailing space
			// after SubOption=..., so trim before matching.
			const m = Regexes.ActionStartRegex.exec(line.trimEnd());
			if (m != null) {
				const blockType = m[1];
				const rawEntity = m[2];
				const entityId = this.helper.ParseEntity(rawEntity);

				if (blockType === 'GAME_RESET' || blockType === (BlockType.GAME_RESET as unknown as string)) {
					this.handleGameResetBlockStart(stream, entityId, normalizedTimestamp);
				} else {
					// Only cards can carry the REWIND mechanic; reject GameEntity/player/numeric
					// origins upfront so we don't burn cycles deep-cloning on every TRIGGER.
					const origin = classifyBlockOrigin(rawEntity);
					const cardId = origin?.cardId ?? null;
					const isCardOrigin = origin != null;
					this.rewindController.onBlockStart(
						stream,
						entityId,
						cardId,
						blockType,
						normalizedTimestamp,
						isCardOrigin,
					);
				}
			}
			return;
		}

		if (hasBlockEnd) {
			this.rewindController.onBlockEnd(stream);
			this.handleBlockEndForGameReset(stream, normalizedTimestamp);
			return;
		}

		if (line.includes('SHOW_ENTITY')) {
			const m = Regexes.ActionShowEntityRegex.exec(line.trimEnd());
			if (m != null) {
				const rawEntity = m[1];
				const cardId = m[2];
				const entityId = this.helper.ParseEntity(rawEntity);
				this.rewindController.onShowEntity(entityId, cardId && cardId.length > 0 ? cardId : null);
			}
		}
	}

	private handleGameResetBlockStart(stream: LogStream, originEntityId: number, normalizedTimestamp: string): void {
		if (stream === 'GS') {
			const meta = this.rewindController.onGsGameResetStart(originEntityId);
			if (meta != null) {
				this.insideGameResetGS = true;
				this.rewindOriginGS = meta.originEntityId;
				this.fallbackLegacyGameResetGS = false;
				// Enqueue on the GS stream: ClearQueue() flushes GS before PTL, so any event
				// that must be strictly ordered w.r.t. GS-stream parsers (e.g. ENTITY_CHOSEN,
				// which lives on the GS NodeParser) MUST also be on the GS queue or it will
				// always fire after all GS events - defeating the "rewind as if it never
				// happened" semantics for state mutated by GS events.
				this.State.GSState.NodeParser.EnqueueGameEvent([
					GameEventProvider.Create(
						normalizedTimestamp,
						'REWIND_STARTED',
						() => ({
							Type: 'REWIND_STARTED',
							Value: { originEntityId: meta.originEntityId },
						}),
						true,
						null,
					),
				]);
			} else {
				// Legacy fallback: no snapshot captured (unexpected). Let the existing
				// GameResetParser path run: PartialReset() + FULL_ENTITY dispatch. Emit a
				// payload-less REWIND_STARTED so legacy consumers still work.
				this.fallbackLegacyGameResetGS = true;
				this.insideGameResetGS = false;
				this.rewindOriginGS = originEntityId;
				this.State.GSState.NodeParser.EnqueueGameEvent([
					GameEventProvider.Create(
						normalizedTimestamp,
						'REWIND_STARTED',
						() => ({ Type: 'REWIND_STARTED' }),
						true,
						null,
					),
				]);
			}
		} else {
			// PTL side: apply the parked PTL snapshot half if we have one.
			const meta = this.rewindController.onPtlGameResetStart(originEntityId);
			if (meta != null) {
				this.insideGameResetPTL = true;
				this.rewindOriginPTL = meta.originEntityId;
				this.fallbackLegacyGameResetPTL = false;
			} else {
				this.fallbackLegacyGameResetPTL = true;
				this.insideGameResetPTL = false;
				this.rewindOriginPTL = originEntityId;
			}
		}
	}

	private handleBlockEndForGameReset(stream: LogStream, normalizedTimestamp: string): void {
		if (stream === 'GS' && (this.insideGameResetGS || this.fallbackLegacyGameResetGS)) {
			const origin = this.rewindOriginGS;
			this.insideGameResetGS = false;
			this.fallbackLegacyGameResetGS = false;
			this.rewindOriginGS = null;
			// Pair with REWIND_STARTED on the same (GS) queue so consumer-side state that
			// was mutated by GS-stream events (discoversThisGame, hand contents, etc.) rolls
			// back cleanly before any post-rewind events are processed.
			this.State.GSState.NodeParser.EnqueueGameEvent([
				GameEventProvider.Create(
					normalizedTimestamp,
					'REWIND_OVER',
					() => ({
						Type: 'REWIND_OVER',
						Value: origin != null ? { originEntityId: origin } : undefined,
					}),
					true,
					null,
				),
			]);
		}
		if (stream === 'PTL' && (this.insideGameResetPTL || this.fallbackLegacyGameResetPTL)) {
			this.insideGameResetPTL = false;
			this.fallbackLegacyGameResetPTL = false;
			this.rewindOriginPTL = null;
		}
	}

	private emitRewindCapableActionStart(meta: ParserSnapshotMeta): void {
		// IMPORTANT: must be enqueued on the GS stream, not PTL. Offline replay flushes the
		// GS queue in full before the PTL queue, so a PTL-side snapshot event would fire
		// AFTER every GS-stream event (including ENTITY_CHOSEN) - meaning the consumer would
		// snapshot an already-mutated state and "rewind" to it, which is a no-op for fields
		// like discoversThisGame, hand contents, etc.
		this.State.GSState.NodeParser.EnqueueGameEvent([
			GameEventProvider.Create(
				meta.capturedAt,
				'REWIND_CAPABLE_ACTION_START',
				() => ({
					Type: 'REWIND_CAPABLE_ACTION_START',
					Value: {
						originEntityId: meta.originEntityId,
						originCardId: meta.originCardId,
						blockType: meta.blockType,
					},
				}),
				true,
				null,
			),
		]);
	}

	private AddData(timestamp: string, method: string, data: string, gameSeed: number): void {
		const normalizedTimestamp = this.NormalizeTimestamp(timestamp);
		switch (method) {
			case 'GameState.DebugPrintPower':
			case 'GameState.DebugPrintGame':
			case 'Spectator':
				// `resettingGame` on DataHandler is a legacy signal that only the old re-parse
				// flow ever set to true (to suppress reconnect detection during replay). The
				// snapshot-based flow never re-processes CREATE_GAME, so pass false.
				this.dataHandler.Handle(
					normalizedTimestamp,
					data,
					this.State.GSState,
					StateType.GameState,
					this.previousTimestamp,
					this.State.StateFacade,
					gameSeed,
					false,
				);
				this.previousTimestamp = normalizedTimestamp;
				this.State.StateFacade.LastProcessedGSLine = data;
				break;
			case 'GameState.DebugPrintEntityChoices':
				ChoicesHandler.Handle(normalizedTimestamp, data, this.State.GSState, this.helper);
				this.previousTimestamp = normalizedTimestamp;
				break;
			case 'GameState.DebugPrintEntitiesChosen':
				EntityChosenHandler.Handle(normalizedTimestamp, data, this.State.GSState, this.helper);
				this.previousTimestamp = normalizedTimestamp;
				break;
			case 'GameState.DebugPrintOptions':
				OptionsHandler.Handle(
					normalizedTimestamp,
					data,
					this.State.GSState,
					StateType.GameState,
					this.State.StateFacade,
					this.helper,
				);
				OptionsHandler.Handle(
					normalizedTimestamp,
					data,
					this.State.PTLState,
					StateType.PowerTaskList,
					this.State.StateFacade,
					this.helper,
				);
				this.previousTimestamp = normalizedTimestamp;
				break;
			case 'PowerTaskList.DebugPrintPower':
				this.dataHandler.Handle(
					normalizedTimestamp,
					data,
					this.State.PTLState,
					StateType.PowerTaskList,
					this.previousTimestamp,
					this.State.StateFacade,
					gameSeed,
					false,
				);
				this.powerDataHandler.Handle(normalizedTimestamp, data, this.State.PTLState);
				if (this.State.StateFacade.ShouldUpdateToRoot(data)) {
					Logger.Log('Update to root', data);
					this.State.StateFacade.UpdatePTLToRoot();
				}
				this.previousTimestamp = normalizedTimestamp;
				this.State.StateFacade.LastProcessedPTLLine = data;
				break;
			case 'ChoiceCardMgr.WaitThenShowChoices':
				ChoicesHandler.Handle(normalizedTimestamp, data, this.State.GSState, this.helper);
				this.previousTimestamp = normalizedTimestamp;
				break;
			case 'PowerProcessor.EndCurrentTaskList':
				PowerProcessorHandler.Handle(
					normalizedTimestamp,
					data,
					this.State.GSState,
					StateType.PowerTaskList,
					this.State.StateFacade,
				);
				this.previousTimestamp = normalizedTimestamp;
				break;
			default:
				break;
		}
	}

	emitPtlGameState(): void {
		const facade = this.State.StateFacade;
		if (!facade.LocalPlayer || !facade.OpponentPlayer) {
			return;
		}
		this.ptlGameState$.next({
			gameState: this.State.PTLState.GameState,
			localPlayerId: facade.LocalPlayer.PlayerId,
			opponentPlayerId: facade.OpponentPlayer.PlayerId,
		});
	}

	private NormalizeTimestamp(timestamp: string): string {
		if (!timestamp) return '';
		const match = timestamp.match(/^(\d+):(\d+):(\d+)\.(\d+)$/);
		if (!match) return timestamp;

		const hours = parseInt(match[1], 10);
		const minutes = match[2];
		const seconds = match[3];
		const fraction = match[4].slice(0, 6).padEnd(6, '0');

		return hours.toString().padStart(2, '0') + ':' + minutes + ':' + seconds + '.' + fraction;
	}

	ExtractGameSeed(lines: string[]): number {
		let isGameCreation = false;
		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			if (line.includes('CREATE_GAME')) {
				isGameCreation = true;
			}
			if (!line.includes('GAME_SEED')) {
				continue;
			}

			const valueIndex = line.indexOf('tag=GAME_SEED value=');
			if (valueIndex >= 0) {
				const valueStart = valueIndex + 'tag=GAME_SEED value='.length;
				let valueEnd = valueStart;
				while (valueEnd < line.length && line[valueEnd] >= '0' && line[valueEnd] <= '9') {
					valueEnd++;
				}
				if (valueEnd > valueStart) {
					const seedValue = line.substring(valueStart, valueEnd);
					Logger.Log('Extracted seed', seedValue);
					return parseInt(seedValue, 10);
				}
			}
		}
		if (isGameCreation) {
			Logger.Log('CREATE_GAME without seed', lines[lines.length - 1]);
		}
		return isGameCreation ? -1 : 0;
	}
}

// Silence unused-import guardrails: Node and HearthstoneReplay are only used in type
// positions above. These `void` references are harmless and make the intent explicit.
void Node;
