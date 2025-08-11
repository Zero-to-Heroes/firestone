import { Injectable, Optional } from '@angular/core';
import { CardMousedOverService, Side } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';
import { distinctUntilChanged, filter, pairwise } from 'rxjs/operators';
import { GameState } from '../../models/game-state';
import { GameStateFacadeService } from '../game-state-facade.service';
import { CardsHighlightCommonService } from './cards-highlight-common.service';

@Injectable({ providedIn: 'root' })
export class CardsHighlightService extends CardsHighlightCommonService {
	constructor(
		protected override readonly allCards: CardsFacadeService,
		private readonly prefs: PreferencesService,
		private readonly gameStateService: GameStateFacadeService,
		@Optional() private readonly mousedOverService: CardMousedOverService,
	) {
		super(allCards);
		this.setup();
	}

	protected override async setup() {
		await waitForReady(this.gameStateService);

		const obs: Observable<GameState> = this.gameStateService.gameState$$.pipe(filter((gameState) => !!gameState));
		super.setup(obs, async () => {
			const prefs = await this.prefs.getPreferences();
			return prefs.overlayHighlightRelatedCards;
		});

		if (this.mousedOverService) {
			this.mousedOverService.mousedOverCard$$
				.pipe(
					distinctUntilChanged(
						(a, b) => a?.EntityId === b?.EntityId && a?.Zone === b?.Zone && a?.Side === b?.Side,
					),
					pairwise(),
				)
				.subscribe(([previousMouseOverCard, mousedOverCard]) => {
					if (previousMouseOverCard) {
						if (!mousedOverCard || previousMouseOverCard.CardId !== mousedOverCard.CardId) {
							this.onMouseLeave(previousMouseOverCard.CardId);
						}
					}

					if (mousedOverCard) {
						this.onMouseEnter(
							mousedOverCard.CardId,
							mousedOverCard.EntityId,
							mousedOverCard.Side === Side.FRIENDLY
								? 'player'
								: mousedOverCard.Side === Side.OPPOSING
									? 'opponent'
									: 'single',
						);
					}
				});
		}
	}
}
