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
import { CardIds, GameTag, Race, getBuddy, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsMetaCompositionStrategiesService, BgsStateFacadeService } from '@firestone/battlegrounds/common';
import {
	ExtendedBgsCompAdvice,
	MinionInfo,
	Tier,
	buildCompositions,
	buildTiers,
	enhanceTiers,
	getActualTribes,
	getAllCardsInGame,
} from '@firestone/battlegrounds/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { ExpertContributorsService, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, deepEqual } from '@firestone/shared/framework/common';
import { CardRulesService, CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import {
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	startWith,
	takeUntil,
	tap,
} from 'rxjs';
import { DebugService } from '../../../services/debug.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'battlegrounds-minions-tiers',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'./battlegrounds-minions-tiers.component.scss',
	],
	template: `
		<div class="battlegrounds-minions-tiers scalable battlegrounds-theme">
			<battlegrounds-minions-tiers-view
				[tiers]="tiers$ | async"
				[compositions]="compositions$ | async"
				[currentTurn]="currentTurn$ | async"
				[tavernTier]="tavernTier$ | async"
				[showMinionsList]="showMinionsList$ | async"
				[showTribesHighlight]="showTribesHighlight$ | async"
				[highlightedMinions]="highlightedMinions$ | async"
				[highlightedTribes]="highlightedTribes$ | async"
				[highlightedMechanics]="highlightedMechanics$ | async"
				[enableMouseOver]="enableMouseOver$ | async"
				[showGoldenCards]="showGoldenCards$ | async"
				[showTrinketTips]="showTrinketTips$ | async"
				[showTurnNumber]="showTurnNumber$ | async"
				[useNewTiersHeaderStyle]="useNewTiersHeaderStyle$ | async"
				[minionsOnBoardAndHand]="minionsOnBoardAndHand$ | async"
				[minionsInShop]="minionsInShop$ | async"
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
	compositions$: Observable<readonly ExtendedBgsCompAdvice[]>;
	highlightedTribes$: Observable<readonly Race[]>;
	highlightedMechanics$: Observable<readonly GameTag[]>;
	highlightedMinions$: Observable<readonly string[]>;
	currentTurn$: Observable<number>;
	tavernTier$: Observable<number>;
	showTribesHighlight$: Observable<boolean>;
	showMinionsList$: Observable<boolean>;
	showTurnNumber$: Observable<boolean>;
	enableMouseOver$: Observable<boolean>;
	showGoldenCards$: Observable<boolean>;
	showTrinketTips$: Observable<boolean>;
	useNewTiersHeaderStyle$: Observable<boolean>;
	minionsOnBoardAndHand$: Observable<readonly string[]>;
	minionsInShop$: Observable<readonly string[]>;

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
		private readonly cardRules: CardRulesService,
		private readonly strategies: BgsMetaCompositionStrategiesService,
		private readonly contributors: ExpertContributorsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.bgGameState, this.gameState, this.cardRules, this.strategies);
		const cardRules = await this.cardRules.rules$$.getValueWithInit();

		const playerTrinkets$ = this.bgGameState.gameState$$.pipe(
			debounceTime(200),
			this.mapData((main) => ({
				lesser: main?.currentGame?.getMainPlayer()?.lesserTrinket,
				greater: main?.currentGame?.getMainPlayer()?.greaterTrinket,
			})),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const staticTiers$ = combineLatest([
			this.prefs.preferences$$,
			this.bgGameState.gameState$$,
			this.gameState.gameState$$,
			playerTrinkets$,
		]).pipe(
			map(([prefs, bgGameState, gameState, playerTrinkets]) => ({
				showMechanicsTiers: prefs.bgsShowMechanicsTiers,
				showTribeTiers: prefs.bgsShowTribeTiers,
				showTierSeven: prefs.bgsShowTierSeven,
				showBuddies: prefs.bgsShowBuddies,
				bgsGroupMinionsIntoTheirTribeGroup: prefs.bgsGroupMinionsIntoTheirTribeGroup,
				bgsIncludeTrinketsInTribeGroups: prefs.bgsIncludeTrinketsInTribeGroups,
				gameMode: gameState?.metadata?.gameType,
				races: bgGameState?.currentGame?.availableRaces,
				hasBuddies: bgGameState?.currentGame?.hasBuddies,
				hasSpells: bgGameState?.currentGame?.hasSpells,
				showSpellsAtBottom: prefs.bgsMinionListShowSpellsAtBottom,
				anomalies: bgGameState?.currentGame?.anomalies,
				hasPrizes: bgGameState?.currentGame?.hasPrizes,
				hasTrinkets: bgGameState?.currentGame?.hasTrinkets,
				showTrinkets: prefs.bgsShowTrinkets,
				playerCardId: bgGameState?.currentGame?.getMainPlayer()?.cardId,
				allPlayersCardIds: bgGameState?.currentGame?.players?.map((p) => p.cardId),
				playerTrinkets: [playerTrinkets?.lesser, playerTrinkets?.greater].filter((trinket) => !!trinket),
			})),
			debounceTime(200),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			this.mapData(
				({
					showMechanicsTiers,
					showTribeTiers,
					showTierSeven,
					showBuddies,
					bgsGroupMinionsIntoTheirTribeGroup,
					bgsIncludeTrinketsInTribeGroups,
					gameMode,
					races,
					hasBuddies,
					hasSpells,
					showSpellsAtBottom,
					anomalies,
					hasPrizes,
					hasTrinkets,
					showTrinkets,
					playerCardId,
					allPlayersCardIds,
					playerTrinkets,
				}) => {
					// hasSpells = true;
					const willShowBuddies = hasBuddies || showBuddies;
					const normalizedPlayerCardId = normalizeHeroCardId(playerCardId, this.allCards);
					const allPlayerCardIds = allPlayersCardIds?.map((p) => normalizeHeroCardId(p, this.allCards)) ?? [];
					const ownBuddyId = willShowBuddies
						? getBuddy(normalizedPlayerCardId as CardIds, this.allCards.getService())
						: null;
					const ownBuddy = !!ownBuddyId ? this.allCards.getCard(ownBuddyId) : null;
					const cardsInGame = getAllCardsInGame(
						races,
						hasSpells,
						hasPrizes,
						hasTrinkets,
						gameMode,
						this.allCards,
						cardRules,
					);
					const cardsToIncludes = !!ownBuddy ? [...cardsInGame, ownBuddy] : cardsInGame;
					const result = buildTiers(
						cardsToIncludes,
						bgsGroupMinionsIntoTheirTribeGroup,
						bgsIncludeTrinketsInTribeGroups,
						showMechanicsTiers,
						showTribeTiers,
						showTierSeven,
						showTrinkets,
						races,
						anomalies,
						normalizedPlayerCardId,
						allPlayerCardIds,
						willShowBuddies,
						hasSpells,
						showSpellsAtBottom,
						hasTrinkets,
						playerTrinkets,
						cardRules,
						this.i18n,
						this.allCards,
					);
					return result;
				},
			),
		);

		const boardComposition$: Observable<readonly MinionInfo[]> = combineLatest([
			this.bgGameState.gameState$$,
			this.gameState.gameState$$,
			playerTrinkets$,
		]).pipe(
			filter(([bgGameState, gameState, trinkets]) => bgGameState?.currentGame?.phase === 'recruit'),
			this.mapData(([bgGameState, gameState, trinkets]) => {
				const trinketsArray = [trinkets.lesser, trinkets.greater].filter((trinket) => !!trinket);
				const allEntities = [...(gameState?.playerDeck?.board ?? []), ...(gameState?.playerDeck?.hand ?? [])];
				const composition = allEntities.map((e) => {
					const result: MinionInfo = {
						cardId: e.cardId,
						tavernTier: this.allCards.getCard(e.cardId).techLevel,
						tribes: getActualTribes(this.allCards.getCard(e.cardId), true, trinketsArray),
					};
					return result;
				});
				return composition;
			}),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			takeUntil(this.destroyed$),
		);
		this.minionsOnBoardAndHand$ = boardComposition$.pipe(this.mapData((board) => board.map((b) => b.cardId)));
		this.tiers$ = combineLatest([
			staticTiers$,
			this.bgGameState.gameState$$.pipe(this.mapData((state) => state?.currentGame?.getMainPlayer()?.cardId)),
			boardComposition$,
			this.bgGameState.gameState$$.pipe(
				this.mapData((state) => state?.currentGame?.getMainPlayer()?.getCurrentTavernTier()),
			),
		]).pipe(
			this.mapData(([tiers, rawPlayerCardId, boardComposition, tavernLevel]) => {
				const playerCardId = normalizeHeroCardId(rawPlayerCardId, this.allCards);
				return enhanceTiers(
					tiers,
					playerCardId,
					boardComposition,
					tavernLevel,
					cardRules,
					this.allCards,
					this.i18n,
				);
			}),
		);
		this.compositions$ = combineLatest([
			this.bgGameState.gameState$$.pipe(this.mapData((state) => state?.currentGame?.availableRaces)),
			this.strategies.strategies$$,
		]).pipe(
			this.mapData(([availableTribes, strategies]) =>
				buildCompositions(availableTribes, strategies, this.allCards, this.i18n),
			),
			tap((comps) => console.debug('comps', comps)),
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
		this.showTrinketTips$ = this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsShowTrinketTipsOverlay));
		this.useNewTiersHeaderStyle$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.bgsUseNewTiersHeaderStyle),
			startWith(true),
			takeUntil(this.destroyed$),
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
