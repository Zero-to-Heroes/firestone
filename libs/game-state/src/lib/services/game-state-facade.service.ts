import { Injectable } from '@angular/core';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { auditTime, BehaviorSubject } from 'rxjs';
import { BattlegroundsState } from '../models/_barrel';
import { DeckState } from '../models/deck-state';
import { GameState } from '../models/game-state';
import { GameStateService } from './game-state.service';

const eventName = 'game-state-facade';

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

	protected override async initElectronSubjects() {
		this.setupElectronSubject(this.gameState$$, eventName);
	}

	protected override async createElectronProxy(ipcRenderer: any) {
		this.gameState$$ = new BehaviorSubject<GameState>(new GameState());
	}

	protected override transformValueForElectron(value: GameState): GameState {
		const bgState: BattlegroundsState | undefined = BattlegroundsState.createForElectron(value.bgState);
		const result = GameState.create({
			...value,
			playerDeck: DeckState.create(value.playerDeck),
			opponentDeck: DeckState.create(value.opponentDeck),
			bgState: bgState,
		});
		return result;
	}
}
