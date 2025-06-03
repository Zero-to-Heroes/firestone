import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardIds, GameTag, Race, getBuddy, getHeroPower, normalizeHeroCardId } from '@firestone-hs/reference-data';
import { BgsBoardHighlighterService, BgsMetaCompositionStrategiesService } from '@firestone/battlegrounds/common';
import {
	ExtendedBgsCompAdvice,
	MinionInfo,
	Tier,
	buildCompositions,
	buildTiers,
	enhanceTiers,
	equalMinionInfo,
	getActualTribes,
	getAllCardsInGame,
} from '@firestone/battlegrounds/core';
import { GameStateFacadeService } from '@firestone/game-state';
import { ExpertContributorsService, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, arraysEqual } from '@firestone/shared/framework/common';
import { CardRulesService, CardsFacadeService, waitForReady } from '@firestone/shared/framework/core';
import {
	Observable,
	auditTime,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	map,
	shareReplay,
	startWith,
	takeUntil,
} from 'rxjs';
import { DebugService } from '../../../services/debug.service';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'battlegrounds-minions-tiers',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		// `../../../../css/themes/battlegrounds-theme.scss`,
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
		private readonly gameState: GameStateFacadeService,
		private readonly cardRules: CardRulesService,
		private readonly strategies: BgsMetaCompositionStrategiesService,
		private readonly contributors: ExpertContributorsService,
		private readonly highlighter: BgsBoardHighlighterService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.gameState, this.cardRules, this.strategies, this.highlighter);
		const cardRules = await this.cardRules.rules$$.getValueWithInit();

		const playerTrinkets$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((gameState) => ({
				lesser: gameState.bgState.currentGame?.getMainPlayer()?.lesserTrinket,
				greater: gameState.bgState.currentGame?.getMainPlayer()?.greaterTrinket,
			})),
			distinctUntilChanged((a, b) => a.lesser === b.lesser && a.greater === b.greater),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const prefs$ = this.prefs.preferences$$.pipe(
			debounceTime(200),
			this.mapData((prefs) => ({
				showMechanicsTiers: prefs.bgsShowMechanicsTiers,
				showTribeTiers: prefs.bgsShowTribeTiers,
				showTierSeven: prefs.bgsShowTierSeven,
				showBuddies: prefs.bgsShowBuddies,
				showTrinkets: prefs.bgsShowTrinkets,
				showSpellsAtBottom: prefs.bgsMinionListShowSpellsAtBottom,
				bgsGroupMinionsIntoTheirTribeGroup: prefs.bgsGroupMinionsIntoTheirTribeGroup,
				bgsIncludeTrinketsInTribeGroups: prefs.bgsIncludeTrinketsInTribeGroups,
			})),
			distinctUntilChanged(
				(a, b) =>
					a.bgsGroupMinionsIntoTheirTribeGroup === b.bgsGroupMinionsIntoTheirTribeGroup &&
					a.bgsIncludeTrinketsInTribeGroups === b.bgsIncludeTrinketsInTribeGroups &&
					a.showMechanicsTiers === b.showMechanicsTiers &&
					a.showTribeTiers === b.showTribeTiers &&
					a.showTierSeven === b.showTierSeven &&
					a.showBuddies === b.showBuddies &&
					a.showTrinkets === b.showTrinkets &&
					a.showSpellsAtBottom === b.showSpellsAtBottom,
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const gameMode$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => state?.metadata?.gameType),
			distinctUntilChanged(),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const currentGameInfo$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => ({
				races: state.bgState.currentGame?.availableRaces,
				hasBuddies: state.bgState.currentGame?.hasBuddies,
				hasSpells: state.bgState.currentGame?.hasSpells,
				anomalies: state.bgState.currentGame?.anomalies,
				hasPrizes: state.bgState.currentGame?.hasPrizes,
				hasTrinkets: state.bgState.currentGame?.hasTrinkets,
			})),
			distinctUntilChanged(
				(a, b) =>
					a.hasBuddies === b.hasBuddies &&
					a.hasSpells === b.hasSpells &&
					a.hasPrizes === b.hasPrizes &&
					a.hasTrinkets === b.hasTrinkets &&
					arraysEqual(a.races, b.races) &&
					arraysEqual(a.anomalies, b.anomalies),
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const playerCardIds$ = this.gameState.gameState$$.pipe(
			auditTime(1000),
			this.mapData((state) => ({
				playerCardId: state.bgState.currentGame?.getMainPlayer()?.cardId,
				allPlayersCardIds: state.bgState.currentGame?.players?.map((p) => p.cardId),
			})),
			distinctUntilChanged(
				(a, b) => a.playerCardId === b.playerCardId && arraysEqual(a.allPlayersCardIds, b.allPlayersCardIds),
			),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const staticTiers$ = combineLatest([prefs$, currentGameInfo$, playerCardIds$, gameMode$, playerTrinkets$]).pipe(
			map(([prefs, currentGameInfo, playerCardIds, gameMode, playerTrinkets]) => ({
				...prefs,
				...currentGameInfo,
				...playerCardIds,
				gameMode: gameMode,
				playerTrinkets: [playerTrinkets?.lesser, playerTrinkets?.greater].filter((trinket) => !!trinket),
			})),
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
					const heroPowerCardId = getHeroPower(normalizedPlayerCardId, this.allCards);
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
						playerCardId,
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
						heroPowerCardId,
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

		const phase$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			this.mapData((state) => state.bgState.currentGame?.phase),
			distinctUntilChanged(),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const ownedCards$ = this.gameState.gameState$$.pipe(
			auditTime(500),
			this.mapData((gameState) =>
				[...(gameState?.playerDeck?.board ?? []), ...(gameState?.playerDeck?.hand ?? [])].map((e) => e.cardId),
			),
			distinctUntilChanged((a, b) => arraysEqual(a, b)),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);
		const boardComposition$: Observable<readonly MinionInfo[]> = combineLatest([
			phase$,
			ownedCards$,
			playerTrinkets$,
		]).pipe(
			filter(([phase, ownedCards, trinkets]) => phase !== 'combat'),
			this.mapData(([bgGameState, ownedCards, trinkets]) => {
				const trinketsArray = [trinkets.lesser, trinkets.greater].filter((trinket) => !!trinket);
				const composition = ownedCards.map((cardId) => {
					const result: MinionInfo = {
						cardId: cardId,
						tavernTier: this.allCards.getCard(cardId).techLevel,
						tribes: getActualTribes(this.allCards.getCard(cardId), true, trinketsArray, []),
					};
					return result;
				});
				return composition;
			}),
			distinctUntilChanged((a, b) => a.length === b.length && a.every((e, i) => equalMinionInfo(e, b[i]))),
			startWith([] as readonly MinionInfo[]),
			takeUntil(this.destroyed$),
		);
		this.minionsOnBoardAndHand$ = boardComposition$.pipe(this.mapData((board) => board.map((b) => b.cardId)));
		this.tiers$ = combineLatest([
			staticTiers$,
			this.gameState.gameState$$.pipe(
				auditTime(500),
				this.mapData((state) => state.bgState.currentGame?.getMainPlayer()?.cardId),
			),
			boardComposition$,
			this.gameState.gameState$$.pipe(
				auditTime(500),
				this.mapData((state) => state.bgState.currentGame?.getMainPlayer()?.getCurrentTavernTier()),
			),
		]).pipe(
			this.mapData(([tiers, rawPlayerCardId, boardComposition, tavernLevel]) => {
				const playerCardId = normalizeHeroCardId(rawPlayerCardId, this.allCards);
				const result = enhanceTiers(
					tiers,
					playerCardId,
					boardComposition,
					tavernLevel,
					cardRules,
					this.allCards,
					this.i18n,
				);
				return result;
			}),
		);
		this.compositions$ = combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsMinionsListShowCompositions)),
			this.gameState.gameState$$.pipe(
				this.mapData((state) => state.bgState.currentGame?.availableRaces),
				distinctUntilChanged((a, b) => arraysEqual(a, b)),
			),
			this.gameState.gameState$$.pipe(this.mapData((state) => state.bgState.currentGame?.hasTrinkets)),
			this.strategies.strategies$$,
		]).pipe(
			this.mapData(([showFromPrefs, availableTribes, hasTrinkets, strategies]) =>
				showFromPrefs
					? buildCompositions(availableTribes, strategies, hasTrinkets, this.allCards, this.i18n)
					: [],
			),
		);

		this.highlightedTribes$ = this.highlighter.highlightedTribes$$.pipe(this.mapData((info) => info));
		this.highlightedMechanics$ = this.highlighter.highlightedMechanics$$.pipe(this.mapData((info) => info));
		this.highlightedMinions$ = this.highlighter.highlightedMinions$$.pipe(this.mapData((info) => info));
		this.currentTurn$ = this.gameState.gameState$$.pipe(this.mapData((main) => main.currentTurnNumeric));
		this.tavernTier$ = this.gameState.gameState$$.pipe(
			this.mapData((main) => main.bgState.currentGame?.getMainPlayer()?.getCurrentTavernTier()),
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
		combineLatest([
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.globalWidgetScale ?? 100)),
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.bgsMinionsListScale ?? 100)),
		])
			.pipe(takeUntil(this.destroyed$))
			.subscribe(([globalScale, scale]) => {
				const newScale = (globalScale / 100) * (scale / 100);
				let element = this.el.nativeElement.querySelector('.scalable');
				if (!!element) {
					this.renderer.setStyle(element, 'transform', `scale(${newScale})`);
					element.style.setProperty('--scale', `${newScale}`);
					element = null;
				}
			});

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
