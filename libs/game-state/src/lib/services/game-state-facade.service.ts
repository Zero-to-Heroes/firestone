import { Injectable } from '@angular/core';
import { isBattlegrounds } from '@firestone-hs/reference-data';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { auditTime, BehaviorSubject } from 'rxjs';
import { BattlegroundsState } from '../models/_barrel';
import { DeckState } from '../models/deck-state';
import { GameState } from '../models/game-state';
import { GameStateService } from './game-state.service';
import { sanitizeParserStateForElectron } from './parser-entity-utils';

const eventName = 'game-state-facade';

/**
 * Main→renderer wire value: materialize Tags, strip non-cloneable deck fields, shrink
 * parserState. Standalone (not a method) so offline perf harnesses can measure the
 * exact production serialization (test-tools/perf/full-pipeline-perf.spec.ts).
 *
 * For BG games, dead REMOVEDFROMGAME entities are dropped from the wire copy — they
 * were ~73% of the late-game payload and no BG renderer consumer reads them (Plan D
 * payload diet, see sanitizeParserStateForElectron).
 */
export const serializeGameStateForElectron = (value: GameState): GameState => {
	return GameState.create({
		...value,
		parserState: sanitizeParserStateForElectron(value.parserState, {
			dropRemovedFromGame: isBattlegrounds(value.metadata?.gameType),
		}),
		playerDeck: DeckState.createForElectron(value.playerDeck),
		opponentDeck: DeckState.createForElectron(value.opponentDeck),
		bgState: value.bgState,
	});
};

@Injectable()
export class GameStateFacadeService extends AbstractFacadeService<GameStateFacadeService> {
	public gameState$$: BehaviorSubject<GameState>;

	private gameStateService: GameStateService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'GameStateFacadeService', () => !!this.gameState$$);
	}

	protected override assignSubjects() {
		this.gameState$$ = this.mainInstance.gameState$$;
	}

	protected async init() {
		this.gameState$$ = new BehaviorSubject<GameState>(new GameState());
		this.gameStateService = AppInjector.get(GameStateService);
		console.log('[game-state-facade] ready');

		this.gameStateService.deckEventBus.pipe(auditTime(500)).subscribe(async (event: GameState | null) => {
			this.gameState$$.next(event ?? new GameState());
		});
	}

	/** Memory release after Hearthstone exits — see GameStateService.releaseSessionState */
	public releaseSessionState(): void {
		this.mainInstance.releaseSessionStateInternal();
	}

	protected releaseSessionStateInternal(): void {
		this.gameStateService?.releaseSessionState();
	}

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.gameState$$, eventName, {
			serialize: (gameState: GameState) => this.serializeForElectron(gameState),
			hydrate: (gameState: GameState) => this.hydrateForElectron(gameState),
		});
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.gameState$$ = new BehaviorSubject<GameState>(new GameState());
	}

	/** Main→renderer: materialize Tags, strip non-cloneable deck fields, shrink parserState. */
	protected serializeForElectron(value: GameState): GameState {
		return serializeGameStateForElectron(value);
	}

	/** Renderer receive: restore class instances. parserState is already plain { Id, CardId, Tags }. */
	protected hydrateForElectron(value: GameState): GameState {
		return GameState.create({
			...value,
			playerDeck: DeckState.createForElectron(value.playerDeck),
			opponentDeck: DeckState.createForElectron(value.opponentDeck),
			bgState: BattlegroundsState.createForElectron(value.bgState),
		});
	}
}
