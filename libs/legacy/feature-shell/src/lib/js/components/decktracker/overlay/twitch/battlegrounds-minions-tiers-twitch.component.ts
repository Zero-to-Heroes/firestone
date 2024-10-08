import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Input,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardIds, GameType, Race, getBuddy, normalizeHeroCardId } from '@firestone-hs/reference-data';
import {
	MinionInfo,
	Tier,
	buildTiers,
	enhanceTiers,
	getActualTribes,
	getAllCardsInGame,
} from '@firestone/battlegrounds/core';
import { GameState } from '@firestone/game-state';
import { deepEqual } from '@firestone/shared/framework/common';
import {
	CardRulesService,
	CardsFacadeService,
	ILocalizationService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { AbstractSubscriptionTwitchResizableComponent, TwitchPreferencesService } from '@firestone/twitch/common';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, from, takeUntil } from 'rxjs';

@Component({
	selector: 'battlegrounds-minions-tiers-twitch',
	styleUrls: [
		`../../../../../css/global/cdk-overlay.scss`,
		`../../../../../css/global/scrollbar-decktracker-overlay.scss`,
		'../../../battlegrounds/minions-tiers/battlegrounds-minions-tiers.component.scss',
		'./battlegrounds-minions-tiers-twitch.component.scss',
	],
	template: `
		<div class="root" cdkDrag (cdkDragStarted)="startDragging()" (cdkDragReleased)="stopDragging()">
			<battlegrounds-minions-tiers-view
				class="scalable"
				[tiers]="tiers$ | async"
				[currentTurn]="currentTurn$ | async"
				[showTurnNumber]="true"
				[showMinionsList]="true"
				[showTribesHighlight]="false"
				[enableMouseOver]="true"
				[showGoldenCards]="showGoldenCards$ | async"
			></battlegrounds-minions-tiers-view>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsMinionsTiersTwitchOverlayComponent
	extends AbstractSubscriptionTwitchResizableComponent
	implements AfterContentInit, OnDestroy, AfterViewInit
{
	tiers$: Observable<readonly Tier[]>;
	currentTurn$: Observable<number>;
	showGoldenCards$: Observable<boolean>;

	@Input() set availableRaces(value: readonly Race[]) {
		this.availableRaces$$.next(value ?? []);
	}
	@Input() set currentTurn(value: number) {
		this.currentTurn$$.next(value);
	}
	@Input() set hasBuddies(value: boolean) {
		this.hasBuddies$$.next(value);
	}
	@Input() set hasSpells(value: boolean) {
		this.hasSpells$$.next(value);
	}
	@Input() set hasPrizes(value: boolean) {
		this.hasPrizes$$.next(value);
	}
	@Input() set hasTrinkets(value: boolean) {
		this.hasTrinkets$$.next(value);
	}
	@Input() set anomalies(value: readonly string[]) {
		this.anomalies$$.next(value ?? []);
	}
	@Input() set playerCardId(value: string) {
		this.playerCardId$$.next(value);
	}
	@Input() set allPlayerCardIds(value: readonly string[]) {
		this.allPlayerCardIds$$.next(value ?? []);
	}
	@Input() set showMechanicsTiers(value: boolean) {
		this.showMechanicsTiers$$.next(value);
	}
	@Input() set showTribeTiers(value: boolean) {
		this.showTribeTiers$$.next(value);
	}
	@Input() set showTierSeven(value: boolean) {
		this.showTierSeven$$.next(value);
	}
	@Input() set showBuddies(value: boolean) {
		this.showBuddies$$.next(value);
	}
	@Input() set showTrinkets(value: boolean) {
		this.showTrinkets$$.next(value);
	}
	@Input() set groupMinionsIntoTheirTribeGroup(value: boolean) {
		this.groupMinionsIntoTheirTribeGroup$$.next(value);
	}
	@Input() set includeTrinketsInTribeGroups(value: boolean) {
		this.includeTrinketsInTribeGroups$$.next(value);
	}
	@Input() set gameMode(value: GameType) {
		this.gameMode$$.next(value);
	}
	@Input() set playerTrinkets(value: readonly string[]) {
		this.playerTrinkets$$.next(value);
	}
	@Input() set gameState(value: GameState) {
		this.gameState$$.next(value);
	}
	@Input() set currentTavernTier(value: number) {
		this.currentTavernTier$$.next(value);
	}

	private availableRaces$$ = new BehaviorSubject<readonly Race[]>([]);
	private currentTurn$$ = new BehaviorSubject<number>(null);
	private currentTavernTier$$ = new BehaviorSubject<number>(null);
	private hasBuddies$$ = new BehaviorSubject<boolean>(false);
	private hasSpells$$ = new BehaviorSubject<boolean>(false);
	private hasPrizes$$ = new BehaviorSubject<boolean>(false);
	private hasTrinkets$$ = new BehaviorSubject<boolean>(false);
	private anomalies$$ = new BehaviorSubject<readonly string[]>([]);
	private playerCardId$$ = new BehaviorSubject<string>(null);
	private allPlayerCardIds$$ = new BehaviorSubject<readonly string[]>([]);
	private playerTrinkets$$ = new BehaviorSubject<readonly string[]>([]);
	private showMechanicsTiers$$ = new BehaviorSubject<boolean>(false);
	private showTribeTiers$$ = new BehaviorSubject<boolean>(false);
	private showTierSeven$$ = new BehaviorSubject<boolean>(false);
	private showBuddies$$ = new BehaviorSubject<boolean>(false);
	private showTrinkets$$ = new BehaviorSubject<boolean>(false);
	private groupMinionsIntoTheirTribeGroup$$ = new BehaviorSubject<boolean>(false);
	private includeTrinketsInTribeGroups$$ = new BehaviorSubject<boolean>(true);
	private gameMode$$ = new BehaviorSubject<GameType>(GameType.GT_BATTLEGROUNDS);
	private gameState$$ = new BehaviorSubject<GameState>(null);

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		protected readonly prefs: TwitchPreferencesService,
		protected readonly el: ElementRef,
		protected readonly renderer: Renderer2,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: ILocalizationService,
		private readonly cardRules: CardRulesService,
	) {
		super(cdr, prefs, el, renderer);
	}

	async ngAfterContentInit() {
		await waitForReady(this.cardRules);

		const cardRules = await this.cardRules.rules$$.getValueWithInit();

		const staticTiers$ = combineLatest([
			this.availableRaces$$,
			this.hasBuddies$$,
			this.hasSpells$$,
			this.anomalies$$,
			this.hasPrizes$$,
			this.hasTrinkets$$,
			this.playerCardId$$,
			this.allPlayerCardIds$$,
			this.showMechanicsTiers$$,
			this.showTribeTiers$$,
			this.showTierSeven$$,
			this.showBuddies$$,
			this.showTrinkets$$,
			this.groupMinionsIntoTheirTribeGroup$$,
			this.includeTrinketsInTribeGroups$$,
			this.gameMode$$,
			this.playerTrinkets$$,
		]).pipe(
			this.mapData(
				([
					races,
					hasBuddies,
					hasSpells,
					anomalies,
					hasPrizes,
					hasTrinkets,
					playerCardId,
					allPlayersCardIds,
					showMechanicsTiers,
					showTribeTiers,
					showTierSeven,
					showBuddies,
					showTrinkets,
					bgsGroupMinionsIntoTheirTribeGroup,
					bgsIncludeTrinketsInTribeGroups,
					gameMode,
					playerTrinkets,
				]) => {
					const willShowBuddies = showBuddies || hasBuddies;
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
					console.debug('card rules', cardRules);
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
						true,
						hasTrinkets,
						playerTrinkets,
						cardRules,
						this.i18n,
						this.allCards,
					);
					console.debug('built tiers', result);
					return result;
				},
			),
		);

		const boardComposition$: Observable<readonly MinionInfo[]> = combineLatest([
			this.gameState$$,
			this.playerTrinkets$$,
		]).pipe(
			this.mapData(([gameState, trinkets]) => {
				const allEntities = [...(gameState?.playerDeck?.board ?? []), ...(gameState?.playerDeck?.hand ?? [])];
				const composition = allEntities.map((e) => {
					const result: MinionInfo = {
						cardId: e.cardId,
						tavernTier: this.allCards.getCard(e.cardId).techLevel,
						tribes: getActualTribes(this.allCards.getCard(e.cardId), true, trinkets),
					};
					return result;
				});
				return composition;
			}),
			distinctUntilChanged((a, b) => deepEqual(a, b)),
			takeUntil(this.destroyed$),
		);

		this.tiers$ = combineLatest([
			staticTiers$,
			this.playerCardId$$,
			boardComposition$,
			this.currentTavernTier$$,
		]).pipe(
			this.mapData(([tiers, rawPlayerCardId, boardComposition, tavernLevel]) => {
				console.debug('[tiers] updating tiers');
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

		this.currentTurn$ = this.currentTurn$$.asObservable().pipe(this.mapData((currentTurn) => currentTurn));
		this.showGoldenCards$ = from(this.prefs.prefs.asObservable()).pipe(
			this.mapData((prefs) => prefs?.showMinionsListGoldenCards),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	ngAfterViewInit(): void {
		super.listenForResize();
	}

	startDragging() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async stopDragging() {
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
