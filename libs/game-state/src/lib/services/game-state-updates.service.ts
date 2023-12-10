import { Injectable } from '@angular/core';
import { SubscriberAwareBehaviorSubject } from '@firestone/shared/framework/common';
import { AbstractFacadeService, WindowManagerService } from '@firestone/shared/framework/core';
import { GameState } from '../models/game-state';

@Injectable()
export class GameStateUpdatesService extends AbstractFacadeService<GameStateUpdatesService> {
	public gameState$$: SubscriberAwareBehaviorSubject<GameState | null>;

	constructor(protected override readonly windowManager: WindowManagerService) {
		super(windowManager, 'gameStateUpdates', () => !!this.gameState$$);
	}

	protected override assignSubjects() {
		this.gameState$$ = this.mainInstance.gameState$$;
	}

	protected async init() {
		this.gameState$$ = new SubscriberAwareBehaviorSubject<GameState | null>(null);
	}

	public async updateGameState(gameState: GameState) {
		this.mainInstance.updateGameStateInternal(gameState);
	}

	private updateGameStateInternal(gameState: GameState) {
		this.gameState$$.next(gameState);
	}
}
