import { Injectable } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { GameState } from '../../../models/decktracker/game-state';
import { AppUiStoreFacadeService } from '../../ui-store/app-ui-store-facade.service';
import { CardsHighlightCommonService } from './cards-highlight-common.service';

@Injectable()
export class CardsHighlightService extends CardsHighlightCommonService {
	constructor(
		protected readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
	) {
		super(allCards);
		this.setup();
		window['cardsHighlightService'] = this;
	}

	protected async setup() {
		await this.store.initComplete();
		const obs: Observable<GameState> = this.store
			.listenDeckState$((gameState) => gameState)
			.pipe(
				filter((gameState) => !!gameState),
				map(([gameState]) => gameState),
				takeUntil(this.destroyed$),
			);
		super.setup(obs, async () => {
			const prefs = await this.prefs.getPreferences();
			return prefs.overlayHighlightRelatedCards;
		});
	}
}
