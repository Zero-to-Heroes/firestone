import { Injectable } from '@angular/core';
import { CardsHighlightCommonService, GameState } from '@firestone/game-state';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { TwitchPreferencesService } from '@firestone/twitch/common';
import { Observable } from 'rxjs';

@Injectable()
export class CardsHighlightStandaloneService extends CardsHighlightCommonService {
	constructor(
		protected readonly allCards: CardsFacadeService,
		private readonly prefs: TwitchPreferencesService,
	) {
		super(allCards);
	}

	public async setup(gameStateObs: Observable<GameState>) {
		super.setup(gameStateObs, async () => this.prefs.prefs.getValue()?.overlayHighlightRelatedCards);
	}
}
