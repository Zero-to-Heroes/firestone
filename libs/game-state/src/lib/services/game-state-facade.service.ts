import { Injectable } from '@angular/core';
import { AbstractFacadeService, AppInjector, WindowManagerService } from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { GameState } from '../models/game-state';
import { GameStateService } from './game-state.service';

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

		this.gameStateService.deckEventBus.subscribe(async (event: GameState | null) => {
			this.gameState$$.next(event ?? new GameState());
		});
	}
}
