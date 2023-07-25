import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardIds } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '@models/battlegrounds/battlegrounds-state';
import { DeckCard } from '@models/decktracker/deck-card';
import { GameState } from '@models/decktracker/game-state';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'player-bgs-magmaloc-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBgsMagmalocWidgetWrapperComponent
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
		this.side = 'player';
		this.activeCounter = 'bgsMagmaloc';
		this.onBgs = true;
	}

	ngAfterContentInit(): void {
		this.prefExtractor = (prefs) => prefs.playerBgsMagmalocCounter;
		this.deckStateExtractor = (state: GameState, bgState: BattlegroundsState) => {
			const isRecruitPhase = bgState?.currentGame?.phase === 'recruit';
			if (!isRecruitPhase) {
				return false;
			}

			return (
				this.hasMagmaloc(state.playerDeck.hand) ||
				this.hasMagmaloc(state.playerDeck.board) ||
				this.hasMagmaloc(state.opponentDeck.board)
			);
		};
		super.ngAfterContentInit();
	}

	private hasMagmaloc(zone: readonly DeckCard[]): boolean {
		return zone
			.filter((card) => card.cardId)
			.some((card) => [CardIds.Magmaloc_BG25_046, CardIds.Magmaloc_BG25_046_G].includes(card.cardId as CardIds));
	}
}
