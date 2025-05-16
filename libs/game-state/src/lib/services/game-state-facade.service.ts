import { Injectable } from '@angular/core';
import { sleep } from '@firestone/shared/framework/common';
import {
	AbstractFacadeService,
	AppInjector,
	OverwolfService,
	WindowManagerService,
} from '@firestone/shared/framework/core';
import { BehaviorSubject } from 'rxjs';
import { GameState } from '../models/game-state';

@Injectable()
export class GameStateFacadeService extends AbstractFacadeService<GameStateFacadeService> {
	public gameState$$: BehaviorSubject<GameState>;

	private ow: OverwolfService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'GameStateFacadeService', () => !!this.gameState$$);
	}

	protected override assignSubjects() {
		this.gameState$$ = this.mainInstance.gameState$$;
	}

	protected async init() {
		this.gameState$$ = new BehaviorSubject<GameState>(new GameState());
		this.ow = AppInjector.get(OverwolfService);
		console.log('[game-state-facade] ready');

		while (!this.ow.getMainWindow()?.deckEventBus) {
			await sleep(50);
		}

		this.ow.getMainWindow().deckEventBus.subscribe(async (event: GameState) => {
			this.gameState$$.next(event ?? new GameState());
		});
	}
}
