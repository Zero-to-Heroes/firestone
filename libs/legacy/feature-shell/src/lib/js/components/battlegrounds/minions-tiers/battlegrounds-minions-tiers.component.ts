import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	Renderer2,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { CardIds, GameTag, Race, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsStateFacadeService } from '@firestone/battlegrounds/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, map } from 'rxjs';
import { getAllCardsInGame, getBuddy } from '../../../services/battlegrounds/bgs-utils';
import { DebugService } from '../../../services/debug.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
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
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
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
	showTrinkets$: Observable<boolean>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly init_DebugService: DebugService,
		private readonly allCards: CardsFacadeService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly bgGameState: BgsStateFacadeService,
		private readonly gameState: GameStateFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.bgGameState, this.gameState);

		this.tiers$ = combineLatest([
			this.prefs.preferences$$,
			this.bgGameState.gameState$$,
			this.gameState.gameState$$,
		]).pipe(
			map(([prefs, bgGameState, gameState]) => ({
				showMechanicsTiers: prefs.bgsShowMechanicsTiers,
				showTribeTiers: prefs.bgsShowTribeTiers,
				showTierSeven: prefs.bgsShowTierSeven,
				bgsGroupMinionsIntoTheirTribeGroup: prefs.bgsGroupMinionsIntoTheirTribeGroup,
				gameMode: gameState?.metadata?.gameType,
				races: bgGameState?.currentGame?.availableRaces,
				hasBuddies: bgGameState?.currentGame?.hasBuddies,
				hasSpells: bgGameState?.currentGame?.hasSpells,
				anomalies: bgGameState?.currentGame?.anomalies,
				hasPrizes: bgGameState?.currentGame?.hasPrizes,
				hasTrinkets: bgGameState?.currentGame?.hasTrinkets,
				showTrinkets: prefs.bgsShowTrinkets,
				playerCardId: bgGameState?.currentGame?.getMainPlayer()?.cardId,
				allPlayersCardIds: bgGameState?.currentGame?.players?.map((p) => p.cardId),
				playerTrinkets: [
					bgGameState?.currentGame?.getMainPlayer()?.lesserTrinket,
					bgGameState?.currentGame?.getMainPlayer()?.greaterTrinket,
				].filter((trinket) => !!trinket),
			})),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			this.mapData(
				({
					showMechanicsTiers,
					showTribeTiers,
					showTierSeven,
					bgsGroupMinionsIntoTheirTribeGroup,
					gameMode,
					races,
					hasBuddies,
					hasSpells,
					anomalies,
					hasPrizes,
					hasTrinkets,
					showTrinkets,
					playerCardId,
					allPlayersCardIds,
					playerTrinkets,
				}) => {
					// hasSpells = true;
					const normalizedCardId = normalizeHeroCardId(playerCardId, this.allCards);
					const allPlayerCardIds = allPlayersCardIds?.map((p) => normalizeHeroCardId(p, this.allCards)) ?? [];
					const ownBuddyId = hasBuddies ? getBuddy(normalizedCardId as CardIds, this.allCards) : null;
					const ownBuddy = !!ownBuddyId ? this.allCards.getCard(ownBuddyId) : null;
					const cardsInGame = getAllCardsInGame(
						races,
						hasSpells,
						hasPrizes,
						hasTrinkets,
						gameMode,
						this.allCards,
					);
					const cardsToIncludes = !!ownBuddy ? [...cardsInGame, ownBuddy] : cardsInGame;
					const result = buildTiers(
						cardsToIncludes,
						bgsGroupMinionsIntoTheirTribeGroup,
						showMechanicsTiers,
						showTribeTiers,
						showTierSeven,
						showTrinkets,
						races,
						anomalies,
						normalizedCardId,
						allPlayerCardIds,
						hasBuddies,
						hasSpells,
						hasTrinkets,
						playerTrinkets,
						this.i18n,
						this.allCards,
					);
					return result;
				},
			),
		);
		this.highlightedTribes$ = this.bgGameState.gameState$$.pipe(this.mapData((main) => main?.highlightedTribes));
		this.highlightedMechanics$ = this.bgGameState.gameState$$.pipe(
			this.mapData((main) => main?.highlightedMechanics),
		);
		this.highlightedMinions$ = this.bgGameState.gameState$$.pipe(this.mapData((main) => main?.highlightedMinions));
		this.currentTurn$ = this.bgGameState.gameState$$.pipe(this.mapData((main) => main?.currentGame?.currentTurn));
		this.tavernTier$ = this.bgGameState.gameState$$.pipe(
			this.mapData((main) => main?.currentGame?.getMainPlayer()?.getCurrentTavernTier()),
		);
		this.showTribesHighlight$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowTribesHighlight),
		);
		this.showBattlecryHighlight$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsShowMechanicsHighlight),
		);
		this.showMinionsList$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsEnableMinionListOverlay),
		);
		this.showTurnNumber$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsEnableTurnNumbertOverlay),
		);
		this.enableMouseOver$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsEnableMinionListMouseOver),
		);
		this.showGoldenCards$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsMinionListShowGoldenCard),
		);
		this.showSpellsAtBottom$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsMinionListShowSpellsAtBottom),
		);
		this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsMinionsListScale)).subscribe((scale) => {
			let element = this.el.nativeElement.querySelector('.scalable');
			this.renderer.setStyle(element, 'transform', `scale(${scale / 100})`);
			element = null;
		});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
