import { GameType } from '@firestone-hs/reference-data';
import { BehaviorSubject } from 'rxjs';
import { HearthstoneReplay, Game, Node } from './models';
import { CombinedState } from './state/combined-state';
import { GameState } from './state/game-state';
import { StateType, INodeParser } from './state/parser-state';
import { StateFacade } from './state/state-facade';
import { DataHandler } from './handlers/data-handler';
import { PowerDataHandler } from './handlers/power-data-handler';
import { ChoicesHandler } from './handlers/choices-handler';
import { EntityChosenHandler } from './handlers/entity-chosen-handler';
import { OptionsHandler } from './handlers/options-handler';
import { PowerProcessorHandler } from './handlers/power-processor-handler';
import { Helper } from './helper';
import { Regexes } from './regexes';
import { Logger } from './logger';
import { GameEventProvider, GameEvent } from './game-event';
import { EventQueueHandler } from './event-queue-handler';
import { GameEventHandler } from './game-event-handler';
import { NodeParser } from './node-parser';

export { GameEvent } from './game-event';

export interface PtlGameStateUpdate {
	readonly gameState: GameState;
	readonly localPlayerId: number;
	readonly opponentPlayerId: number;
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
	private processedLines: string[] = [];
	private CurrentGameSeed: number = 0;

	private _onGameEvent: ((event: GameEvent) => void) | null = null;
	get onGameEvent(): ((event: GameEvent) => void) | null {
		return this._onGameEvent;
	}
	set onGameEvent(handler: ((event: GameEvent) => void) | null) {
		this._onGameEvent = handler;
		this.gameEventHandler.onEvent = handler;
	}

	private resettingGame: boolean = false;
	private currentResetBlockIndex: number = 0;
	private resettingGames: { originEntity: number; alternatePlayIndexGS: number; alternatePlayIndexPTL: number }[] = [];
	private ignoringAlternateTimelineGS: boolean = false;
	private alternateTimelineBlockDepthGS: number = 0;
	private ignoringAlternateTimelinePTL: boolean = false;
	private alternateTimelineBlockDepthPTL: number = 0;
	private inResetBlockGS: boolean = false;
	private inResetBlockPTL: boolean = false;

	constructor() {
		this.gameEventHandler = new GameEventHandler();
		this.State = new CombinedState(this.createNodeParser.bind(this));
		this.helper = new Helper(this.State);
		this.dataHandler = new DataHandler(this.helper);
		this.powerDataHandler = new PowerDataHandler(this.helper);
		this.previousTimestamp = '';
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

		if (!this.resettingGame && line.includes('GameState') && line.includes('CREATE_GAME')) {
			Logger.Log(`Clearing ${this.processedLines.length} processed lines`, line);
			this.processedLines.length = 0;
		}

		let resetStartMatch: RegExpExecArray | null = null;
		if (line.includes('BLOCK_START')) {
			resetStartMatch = Regexes.ResetStartMatchRegex.exec(line);
		}

		if (!this.resettingGame) {
			if (resetStartMatch && line.includes('GameState.DebugPrintPower()')) {
				const normalizedTimestamp = matchSuccess ? this.NormalizeTimestamp(timestamp!) : new Date().toISOString();
				this.State.PTLState.NodeParser.EnqueueGameEvent([
					GameEventProvider.Create(normalizedTimestamp, 'REWIND_STARTED', () => ({ Type: 'REWIND_STARTED' }), true, null),
				]);
				this.resettingGame = true;
				this.currentResetBlockIndex = 0;
				this.ignoringAlternateTimelineGS = false;
				this.alternateTimelineBlockDepthGS = 0;
				this.ignoringAlternateTimelinePTL = false;
				this.alternateTimelineBlockDepthPTL = 0;
				this.inResetBlockGS = false;
				this.inResetBlockPTL = false;

				const rawEntity = resetStartMatch![1];
				const entityId = this.helper.ParseEntity(rawEntity);

				let alternatePlayIndexGS = -1;
				let alternatePlayIndexPTL = -1;
				for (let i = this.processedLines.length - 1; i >= 0; i--) {
					const prevLine = this.processedLines[i];
					if (prevLine.includes('BLOCK_START BlockType=PLAY') && prevLine.includes(`id=${entityId} `)) {
						if (prevLine.includes('GameState.') && alternatePlayIndexGS === -1) {
							alternatePlayIndexGS = i;
							break;
						} else if (prevLine.includes('PowerTaskList.') && alternatePlayIndexPTL === -1) {
							alternatePlayIndexPTL = i;
						}
					}
				}

				this.resettingGames.length = 0;
				this.resettingGames.push({ originEntity: entityId, alternatePlayIndexGS, alternatePlayIndexPTL });
				this.processedLines.push(line);
				const linesCopy = [...this.processedLines];
				this.processedLines.length = 0;
				this.Read(linesCopy);
				return;
			}
		}

		const isGameState = line.includes('GameState.');
		const isPowerTaskList = line.includes('PowerTaskList.');

		if (resetStartMatch) {
			if (isGameState) this.inResetBlockGS = true;
			else if (isPowerTaskList) this.inResetBlockPTL = true;
		}

		if (this.resettingGame) {
			const currentBlock = this.resettingGames[this.currentResetBlockIndex];

			if (isGameState) {
				const isAlternatePlayBlock = lineIndex === currentBlock.alternatePlayIndexGS;
				if (isAlternatePlayBlock && line.includes('BLOCK_START BlockType=PLAY') &&
					line.includes(`id=${currentBlock.originEntity} `) && !this.ignoringAlternateTimelineGS) {
					this.ignoringAlternateTimelineGS = true;
					this.alternateTimelineBlockDepthGS = 1;
				} else if (this.ignoringAlternateTimelineGS && line.includes('BLOCK_START')) {
					this.alternateTimelineBlockDepthGS++;
				} else if (this.ignoringAlternateTimelineGS && line.includes('BLOCK_END')) {
					this.alternateTimelineBlockDepthGS--;
					if (this.alternateTimelineBlockDepthGS === 0) {
						this.ignoringAlternateTimelineGS = false;
					}
				}

				if (this.inResetBlockGS && line.includes('BLOCK_END')) {
					this.inResetBlockGS = false;
				}

				if (this.ignoringAlternateTimelineGS || this.inResetBlockGS) {
					return;
				}
			}

			if (isPowerTaskList) {
				const isAlternatePlayBlock = lineIndex === currentBlock.alternatePlayIndexPTL;
				if (isAlternatePlayBlock && line.includes('BLOCK_START BlockType=PLAY') &&
					line.includes(`id=${currentBlock.originEntity} `) && !this.ignoringAlternateTimelinePTL) {
					this.ignoringAlternateTimelinePTL = true;
					this.alternateTimelineBlockDepthPTL = 1;
				} else if (this.ignoringAlternateTimelinePTL && line.includes('BLOCK_START')) {
					this.alternateTimelineBlockDepthPTL++;
				} else if (this.ignoringAlternateTimelinePTL && line.includes('BLOCK_END')) {
					this.alternateTimelineBlockDepthPTL--;
					if (this.alternateTimelineBlockDepthPTL === 0) {
						this.ignoringAlternateTimelinePTL = false;
					}
				}

				if (this.inResetBlockPTL && line.includes('BLOCK_END')) {
					this.inResetBlockPTL = false;
					this.currentResetBlockIndex++;
					if (this.currentResetBlockIndex === this.resettingGames.length) {
						this.resettingGame = false;
						const normalizedTimestamp = matchSuccess ? this.NormalizeTimestamp(timestamp!) : new Date().toISOString();
						this.State.PTLState.NodeParser.EnqueueGameEvent([
							GameEventProvider.Create(normalizedTimestamp, 'REWIND_OVER', () => ({ Type: 'REWIND_OVER' }), true, null),
						]);
					}
				}

				if (this.ignoringAlternateTimelinePTL || this.inResetBlockPTL) {
					return;
				}
			}
		}

		this.processedLines.push(line);
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

	private AddData(timestamp: string, method: string, data: string, gameSeed: number): void {
		const normalizedTimestamp = this.NormalizeTimestamp(timestamp);
		switch (method) {
			case 'GameState.DebugPrintPower':
			case 'GameState.DebugPrintGame':
			case 'Spectator':
				this.dataHandler.Handle(normalizedTimestamp, data, this.State.GSState, StateType.GameState, this.previousTimestamp, this.State.StateFacade, gameSeed, this.resettingGame);
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
				OptionsHandler.Handle(normalizedTimestamp, data, this.State.GSState, StateType.GameState, this.State.StateFacade, this.helper);
				OptionsHandler.Handle(normalizedTimestamp, data, this.State.PTLState, StateType.PowerTaskList, this.State.StateFacade, this.helper);
				this.previousTimestamp = normalizedTimestamp;
				break;
			case 'PowerTaskList.DebugPrintPower':
				this.dataHandler.Handle(normalizedTimestamp, data, this.State.PTLState, StateType.PowerTaskList, this.previousTimestamp, this.State.StateFacade, gameSeed, this.resettingGame);
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
				PowerProcessorHandler.Handle(normalizedTimestamp, data, this.State.GSState, StateType.PowerTaskList, this.State.StateFacade);
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
		return timestamp;
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
