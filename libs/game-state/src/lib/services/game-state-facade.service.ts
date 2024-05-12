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
	public fullGameState$$: BehaviorSubject<{ event: { name: string }; state: GameState } | null>;
	public gameState$$: BehaviorSubject<GameState | null>;

	private ow: OverwolfService;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'GameStateFacadeService', () => !!this.fullGameState$$);
	}

	protected override assignSubjects() {
		this.fullGameState$$ = this.mainInstance.fullGameState$$;
		this.gameState$$ = this.mainInstance.gameState$$;
	}

	protected async init() {
		this.fullGameState$$ = new BehaviorSubject<{ event: { name: string }; state: GameState } | null>(null);
		this.gameState$$ = new BehaviorSubject<GameState | null>(null);
		this.ow = AppInjector.get(OverwolfService);

		while (!this.ow.getMainWindow()?.deckEventBus) {
			await sleep(50);
		}

		this.ow.getMainWindow().deckEventBus.subscribe(async (event) => {
			this.fullGameState$$.next(event);
			this.gameState$$.next(event?.state);
		});
	}
}
