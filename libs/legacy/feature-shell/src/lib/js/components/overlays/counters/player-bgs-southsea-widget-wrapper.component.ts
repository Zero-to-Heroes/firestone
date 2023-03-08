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
	selector: 'player-bgs-southsea-widget-wrapper',
	styleUrls: ['../../../../css/component/overlays/decktracker-player-widget-wrapper.component.scss'],
	template: templateBase,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlayerBgsSouthseaWidgetWrapperComponent
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
		this.activeCounter = 'bgsSouthsea';
		this.onBgs = true;
	}

	ngAfterContentInit(): void {
		this.prefExtractor = (prefs) => prefs.playerBgsSouthseaCounter;
		this.deckStateExtractor = (state: GameState, bgState: BattlegroundsState) => {
			const isRecruitPhase = bgState?.currentGame?.phase === 'recruit';
			if (!isRecruitPhase) {
				return false;
			}

			if (this.hasSouthseaStrongarm(state.playerDeck.hand)) {
				return true;
			}

			const boughtInfo = bgState.currentGame.liveStats.minionsBoughtOverTurn.find(
				(info) => info.turn === bgState.currentGame.currentTurn,
			);
			const piratesBought = (boughtInfo?.cardIds ?? [])
				.flatMap((cardId) => this.allCards.getCard(cardId).races ?? [])
				.filter((race) =>
					[Race.PIRATE, Race.ALL].map((race) => Race[race].toLowerCase()).includes(race?.toLowerCase()),
				).length;
			return piratesBought > 0 && this.hasSouthseaStrongarm(state.opponentDeck.board);
		};
		super.ngAfterContentInit();
	}

	private hasSouthseaStrongarm(zone: readonly DeckCard[]): boolean {
		return zone
			.filter((card) => card.cardId)
			.some((card) =>
				[CardIds.SouthseaStrongarm, CardIds.SouthseaStrongarmBattlegrounds].includes(card.cardId as CardIds),
			);
	}
}
