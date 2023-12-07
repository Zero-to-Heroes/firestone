import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	Renderer2,
	ViewEncapsulation,
} from '@angular/core';
import { CardIds, GameTag, Race, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { arraysEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, tap } from 'rxjs';
import { getAllCardsInGame, getBuddy } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';
import { Tier, buildTiers } from './battlegrounds-minions-tiers-view.component';

@Component({
	selector: 'battlegrounds-minions-tiers',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/battlegrounds/minions-tiers/battlegrounds-minions-tiers.component.scss',
	],
	template: `
		<div class="battlegrounds-minions-tiers scalable battlegrounds-theme">
			<battlegrounds-minions-tiers-view
				[tiers]="tiers$ | async"
				[currentTurn]="currentTurn$ | async"
				[tavernTier]="tavernTier$ | async"
				[showMinionsList]="showMinionsList$ | async"
				[showTribesHighlight]="showTribesHighlight$ | async"
				[showBattlecryHighlight]="showBattlecryHighlight$ | async"
				[highlightedMinions]="highlightedMinions$ | async"
				[highlightedTribes]="highlightedTribes$ | async"
				[highlightedMechanics]="highlightedMechanics$ | async"
				[enableMouseOver]="enableMouseOver$ | async"
				[showGoldenCards]="showGoldenCards$ | async"
				[showTurnNumber]="showTurnNumber$ | async"
				[showSpellsAtBottom]="showSpellsAtBottom$ | async"
			></battlegrounds-minions-tiers-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsMinionsTiersOverlayComponent
	extends AbstractSubscriptionStoreComponent
	implements AfterContentInit, OnDestroy
{
	private static readonly WINDOW_WIDTH = 1300;

	tiers$: Observable<readonly Tier[]>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMechanics$: Observable<readonly GameTag[]>;
	highlightedMinions$: Observable<readonly string[]>;
	currentTurn$: Observable<number>;
	tavernTier$: Observable<number>;
	showTribesHighlight$: Observable<boolean>;
	showBattlecryHighlight$: Observable<boolean>;
	showMinionsList$: Observable<boolean>;
	showTurnNumber$: Observable<boolean>;
	enableMouseOver$: Observable<boolean>;
	showGoldenCards$: Observable<boolean>;
	showSpellsAtBottom$: Observable<boolean>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly init_DebugService: DebugService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.tiers$ = combineLatest([
			this.store.listenPrefs$(
				(prefs) => prefs.bgsShowMechanicsTiers,
				(prefs) => prefs.bgsShowTribeTiers,
				(prefs) => prefs.bgsGroupMinionsIntoTheirTribeGroup,
			),
			this.store.listenBattlegrounds$(
				([main, prefs]) => main?.currentGame?.availableRaces,
				([main, prefs]) => main?.currentGame?.hasBuddies,
				([main, prefs]) => main?.currentGame?.hasSpells,
				([main, prefs]) => main?.currentGame?.anomalies,
				([main, prefs]) => main?.currentGame?.getMainPlayer()?.cardId,
				([main, prefs]) => main?.currentGame?.players?.map((p) => p.cardId),
			),
		]).pipe(
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			tap((info) => console.debug('[debug] [bgs-minions-tiers] new info', info)),
			this.mapData(
				([
					[showMechanicsTiers, showTribeTiers, bgsGroupMinionsIntoTheirTribeGroup],
					[races, hasBuddies, hasSpells, anomalies, playerCardId, allPlayersCardIds],
				]) => {
					// hasSpells = true;
					const normalizedCardId = normalizeHeroCardId(playerCardId, this.allCards);
					const allPlayerCardIds = allPlayersCardIds?.map((p) => normalizeHeroCardId(p, this.allCards)) ?? [];
					const ownBuddyId = hasBuddies ? getBuddy(normalizedCardId as CardIds, this.allCards) : null;
					const ownBuddy = !!ownBuddyId ? this.allCards.getCard(ownBuddyId) : null;
					const cardsInGame = getAllCardsInGame(races, hasSpells, this.allCards);
					const cardsToIncludes = !!ownBuddy ? [...cardsInGame, ownBuddy] : cardsInGame;
					const result = buildTiers(
						cardsToIncludes,
						bgsGroupMinionsIntoTheirTribeGroup,
						showMechanicsTiers,
						showTribeTiers,
						races,
						anomalies,
						normalizedCardId,
						allPlayerCardIds,
						hasBuddies,
						hasSpells,
						this.i18n,
						this.allCards,
					);
					return result;
				},
			),
		);
		this.highlightedTribes$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.highlightedTribes)
			.pipe(this.mapData(([tribes]) => tribes));
		this.highlightedMechanics$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.highlightedMechanics)
			.pipe(this.mapData(([highlightedMechanics]) => highlightedMechanics));
		this.highlightedMinions$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.highlightedMinions)
			.pipe(this.mapData(([tribes]) => tribes));
		this.currentTurn$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.currentGame?.currentTurn)
			.pipe(this.mapData(([currentTurn]) => currentTurn));
		this.tavernTier$ = this.store
			.listenBattlegrounds$(([main, prefs]) => main.currentGame?.getMainPlayer()?.getCurrentTavernTier())
			.pipe(this.mapData(([tavernTier]) => tavernTier));
		this.showTribesHighlight$ = this.listenForBasicPref$((prefs) => prefs.bgsShowTribesHighlight);
		this.showBattlecryHighlight$ = this.listenForBasicPref$((prefs) => prefs.bgsShowMechanicsHighlight);
		this.showMinionsList$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableMinionListOverlay);
		this.showTurnNumber$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableTurnNumbertOverlay);
		this.enableMouseOver$ = this.listenForBasicPref$((prefs) => prefs.bgsEnableMinionListMouseOver);
		this.showGoldenCards$ = this.listenForBasicPref$((prefs) => prefs.bgsMinionListShowGoldenCard);
		this.showSpellsAtBottom$ = this.listenForBasicPref$((prefs) => prefs.bgsMinionListShowSpellsAtBottom);
		this.listenForBasicPref$((prefs) => prefs.bgsMinionsListScale).subscribe((scale) => {
			// this.el.nativeElement.style.setProperty('--bgs-banned-tribe-scale', scale / 100);
			const element = this.el.nativeElement.querySelector('.scalable');
			this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
		});
	}
}
