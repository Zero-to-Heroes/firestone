import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardClass } from '@firestone-hs/reference-data';
import { hasOrHadHeroClass } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { groupByFunction } from '@firestone/shared/framework/common';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'opponent-corpse-spent-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpponentCorpseSpentWidgetWrapperComponent
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
		this.activeCounter = 'corpseSpent';
		this.prefExtractor = (prefs) => prefs.opponentCorpseSpentCounter;
		this.deckStateExtractor = (state) => {
			if (!hasOrHadHeroClass(state.opponentDeck.hero, [CardClass.DEATHKNIGHT])) {
				return false;
			}

			const entityIdsPlayed = state.opponentDeck.cardsPlayedThisMatch.map((c) => Math.abs(c.entityId));
			const cardsPlayedThisMatch = state.opponentDeck
				.getAllCardsInDeck()
				.filter((c) => entityIdsPlayed.includes(Math.abs(c.entityId)));
			const costs = cardsPlayedThisMatch
				.filter((c) => !!c.cardId)
				.map((c) => this.allCards.getCard(c.cardId))
				.filter((c) => !!c.additionalCosts)
				.map((c) => c.additionalCosts);

			const allRuneEntries = costs.flatMap((c) =>
				Object.entries(c).map((entry) => ({
					rune: entry[0],
					quantity: entry[1],
				})),
			);
			const groupedByRune = groupByFunction((rune: any) => rune.rune)(allRuneEntries);
			return Object.keys(groupedByRune).length === 3;
		};
	}
}
