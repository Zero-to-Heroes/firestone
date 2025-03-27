import { Injectable } from '@angular/core';
import { GameState, GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CardsHighlightCommonService } from './cards-highlight-common.service';

@Injectable()
export class CardsHighlightService extends CardsHighlightCommonService {
	constructor(
		protected readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly gameStateService: GameStateFacadeService,
	) {
		super(allCards);
		this.setup();
		window['cardsHighlightService'] = this;
	}

	protected async setup() {
		await waitForReady(this.gameStateService);

		const obs: Observable<GameState> = this.gameStateService.gameState$$.pipe(
			filter((gameState) => !!gameState),
			takeUntil(this.destroyed$),
		);
		super.setup(obs, async () => {
			const prefs = await this.prefs.getPreferences();
			return prefs.overlayHighlightRelatedCards;
		});
	}
}
