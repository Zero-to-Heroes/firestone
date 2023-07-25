import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Renderer2,
} from '@angular/core';
import { CardIds, Race } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { BattlegroundsState } from '@models/battlegrounds/battlegrounds-state';
import { DeckCard } from '@models/decktracker/deck-card';
import { GameState } from '@models/decktracker/game-state';
import { PreferencesService } from '../../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractCounterWidgetWrapperComponent, templateBase } from './abstract-counter-widget-wrapper.component';

@Component({
	selector: 'player-bgs-majordomo-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBgsMajordomoWidgetWrapperComponent
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
		this.activeCounter = 'bgsMajordomo';
		this.onBgs = true;
	}

	ngAfterContentInit(): void {
		this.prefExtractor = (prefs) => {
			return prefs.playerBgsMajordomoCounter;
		};
		this.deckStateExtractor = (state: GameState, bgState: BattlegroundsState) => {
			const isRecruitPhase = bgState?.currentGame?.phase === 'recruit';
			if (!isRecruitPhase) {
				return false;
			}

			const hasOnBoard = this.hasMajordomo(state.playerDeck.board);
			if (hasOnBoard) {
				return true;
			}

			const deck = this.side === 'player' ? state.playerDeck : state.opponentDeck;
			const elementalsPlayed = deck.cardsPlayedThisTurn
				.flatMap((card) => this.allCards.getCard(card.cardId).races ?? [])
				.filter((race) =>
					[Race.ELEMENTAL, Race.ALL].map((race) => Race[race].toLowerCase()).includes(race?.toLowerCase()),
				).length;
			const result = this.hasMajordomo(state.opponentDeck.board) || this.hasMajordomo(state.playerDeck.hand);
			return elementalsPlayed > 0 && result;
		};
		super.ngAfterContentInit();
	}

	private hasMajordomo(zone: readonly DeckCard[]): boolean {
		return zone
			.filter((card) => card.cardId)
			.some((card) =>
				[CardIds.MajordomoExecutus_BGS_105, CardIds.MajordomoExecutus_TB_BaconUps_207].includes(
					card.cardId as CardIds,
				),
			);
	}
}
