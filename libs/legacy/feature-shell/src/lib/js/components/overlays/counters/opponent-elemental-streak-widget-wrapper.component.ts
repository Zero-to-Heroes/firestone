import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { Race } from '@firestone-hs/reference-data';
import { ShortCardWithTurn } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'opponent-elemental-streak-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentElementalStreakWidgetWrapperComponent
	extends AbstractCounterWidgetWrapperComponent
	implements AfterContentInit
{
	constructor(
		private readonly allCards: CardsFacadeService,
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(ow, el, prefs, renderer, store, cdr);
		this.side = 'opponent';
		this.activeCounter = 'elementalStreak';
		this.prefExtractor = (prefs) => prefs.opponentElementalStreakCounter;
		this.deckStateExtractor = (state, prefValue) => {
			const currentTurn = +state.currentTurn;
			const cards = state.opponentDeck.cardsPlayedThisMatch;
			const groupedByTurn = groupByFunction((card: ShortCardWithTurn) => card.turn)(cards);
			const lastTurn = currentTurn;
			let elementalStreak = 0;
			for (let i = lastTurn; i > 0; i--) {
				const elementals = groupedByTurn[i]?.filter(
					(card) =>
						this.allCards.getCard(card.cardId).races?.includes(Race[Race.ELEMENTAL]) ||
						this.allCards.getCard(card.cardId).races?.includes(Race[Race.ALL]),
				);
				if (!elementals?.length && i !== lastTurn) {
					break;
				} else if (elementals?.length) {
					elementalStreak++;
				}
			}
			return elementalStreak >= 2;
		};
	}
}
