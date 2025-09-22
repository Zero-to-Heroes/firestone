/* eslint-disable no-mixed-spaces-and-tabs */
/* eslint-disable @angular-eslint/template/no-negated-async */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	ViewRef,
} from '@angular/core';
import { ALL_CLASSES, GameFormat, getBaseCardId } from '@firestone-hs/reference-data';
import { DeckParserFacadeService } from '@firestone/app/common';
import {
	ConstructedMulliganGuideGuardianService,
	ConstructedMulliganGuideService,
	MulliganDeckData,
	MulliganDeckStats,
	buildColor,
} from '@firestone/constructed/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { PatchesConfigService, Preferences, PreferencesService, formatPatch } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	CardsFacadeService,
	IAdsService,
	ILocalizationService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { Observable, combineLatest, distinctUntilChanged, filter, shareReplay, switchMap, takeUntil, tap } from 'rxjs';

@Component({
	standalone: false,
	selector: 'constructed-decktracker-extended-ooc',
	styleUrls: ['./constructed-decktracker-extended-ooc.component.scss'],
	template: `
		<ng-container *ngIf="{ info: allDeckMulliganInfo$ | async } as value">
			<mulligan-deck-view
				[deckMulliganInfo]="value.info"
				[showMulliganOverview]="true"
				[showFilters]="true"
				[showArchetypeSelection]="true"
				[rankBracketTooltip]="rankBracketTooltip$ | async"
				[rankBracketLabel]="rankBracketLabel$ | async"
				[opponentTooltip]="opponentTooltip$ | async"
				[opponentLabel]="opponentLabel$ | async"
				[playCoinLabel]="playCoinLabel$ | async"
				[playCoinTooltip]="playCoinTooltip$ | async"
				[timeTooltip]="timeTooltip$ | async"
				[timeLabel]="timeLabel$ | async"
				[formatLabel]="formatLabel$ | async"
				[sampleSize]="sampleSize$ | async"
				[sampleSizeTooltip]="'decktracker.overlay.mulligan.sample-size-tooltip' | fsTranslate"
				[allowResize]="false"
				[cycleRanks]="cycleRanks"
				[cycleOpponent]="cycleOpponent"
				[cyclePlayCoin]="cyclePlayCoin"
				[cycleTime]="cycleTime"
				[cycleFormat]="cycleFormat"
			>
			</mulligan-deck-view>
			<div class="deck-stats" *ngIf="value.info?.globalDeckStats">
				<div class="title" [fsTranslate]="'decktracker.overlay.lobby.deck-stats.title'"></div>
				<div class="category global-stats">
					<div
						class="subtitle"
						[fsTranslate]="'decktracker.overlay.lobby.deck-stats.global-stats-subtitle'"
						[helpTooltip]="'decktracker.overlay.lobby.deck-stats.global-stats-tooltip' | fsTranslate"
					></div>
					<div class="stats ">
						<div class="stat total-games">
							<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
							<div class="value">{{ value.info.globalDeckStats?.totalGames }}</div>
						</div>
						<div class="stat winrate">
							<div class="label" [fsTranslate]="'app.decktracker.stats.winrate'"></div>
							<div class="value">
								{{
									value.info.globalDeckStats?.winrate != null
										? (100 * value.info.globalDeckStats.winrate).toFixed(1) + '%'
										: '-'
								}}
							</div>
						</div>
					</div>
				</div>
				<div class="category player-stats">
					<div
						class="subtitle"
						[fsTranslate]="'decktracker.overlay.lobby.deck-stats.your-stats-subtitle'"
					></div>
					<div class="stats ">
						<div class="stat total-games">
							<div class="label" [fsTranslate]="'app.decktracker.meta.total-games'"></div>
							<div class="value">
								{{ value.info.playerDeckStats?.totalGames }}
							</div>
						</div>
						<div class="stat winrate">
							<div class="label" [fsTranslate]="'app.decktracker.stats.winrate'"></div>
							<div class="value">
								{{
									value.info.playerDeckStats?.winrate != null
										? (100 * value.info.playerDeckStats.winrate).toFixed(1) + '%'
										: '-'
								}}
							</div>
						</div>
					</div>
				</div>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedDecktrackerExtendedOocComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	allDeckMulliganInfo$: Observable<MulliganDeckDataWithDeckStats>;
	showMulliganOverview$: Observable<boolean | null>;

	rankBracketLabel$: Observable<string>;
	rankBracketTooltip$: Observable<string>;
	opponentLabel$: Observable<string>;
	opponentTooltip$: Observable<string>;
	playCoinLabel$: Observable<string>;
	playCoinTooltip$: Observable<string>;
	timeLabel$: Observable<string>;
	timeTooltip$: Observable<string>;
	formatLabel$: Observable<string>;
	sampleSize$: Observable<string>;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly gameState: GameStateFacadeService,
		private readonly mulligan: ConstructedMulliganGuideService,
		private readonly guardian: ConstructedMulliganGuideGuardianService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly patches: PatchesConfigService,
		private readonly deck: DeckParserFacadeService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameState, this.ads, this.guardian, this.prefs, this.patches, this.deck, this.mulligan);

		const deckstring$ = this.deck.currentDeck$$.pipe(this.mapData((deck) => deck?.deckstring));

		this.allDeckMulliganInfo$ = deckstring$.pipe(
			tap((info) => console.debug('[mulligan] will get mulligan info', info)),
			distinctUntilChanged(),
			switchMap((deckstring) => this.mulligan.getMulliganAdvice$(deckstring, { useDeckFormat: true })),
			tap((info) => console.debug('[mulligan] received mulligan info', info)),
			filter((advice) => !!advice),
			this.mapData((guide) => {
				const result: MulliganDeckDataWithDeckStats = {
					deckstring: guide!.deckstring,
					archetypeId: guide!.archetypeId,
					mulliganData: guide!.allDeckCards.map((advice) => ({
						cardId: advice.cardId,
						label: advice.cardId,
						value: advice.score ?? null,
						keepRate: advice.keepRate == null ? null : 100 * advice.keepRate,
						selected: !!guide?.cardsInHand
							.map((cardId) => this.allCards.getRootCardId(getBaseCardId(cardId)))
							.includes(this.allCards.getRootCardId(getBaseCardId(advice.cardId))),
						keptColor: buildColor(
							'hsl(112, 100%, 64%)',
							'hsl(0, 100%, 64%)',
							advice.keepRate ?? 0,
							0.6,
							0.4,
						),
						impactColor: buildColor('hsl(112, 100%, 64%)', 'hsl(0, 100%, 64%)', advice.score ?? 0, 4, -4),
					})),
					format: guide!.format,
					sampleSize: guide!.sampleSize,
					rankBracket: guide!.rankBracket,
					opponentClass: guide!.opponentClass,
					globalDeckStats: guide!.globalDeckStats,
					playerDeckStats: guide!.playerDeckStats,
				};
				return result;
			}),
			shareReplay(1),
			takeUntil(this.destroyed$),
		);

		this.rankBracketLabel$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) =>
					this.i18n.translateString(
						`app.decktracker.filters.rank-bracket.${prefs.decktrackerMulliganRankBracket}`,
					)!,
			),
		);
		this.rankBracketTooltip$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) =>
				prefs.decktrackerMulliganRankBracket === 'competitive'
					? this.i18n.translateString(`app.decktracker.filters.rank-bracket.competitive-tooltip`)
					: this.i18n.translateString(
							`app.decktracker.filters.rank-bracket.${prefs.decktrackerMulliganRankBracket}`,
						),
			),
			this.mapData(
				(rankInfo) =>
					this.i18n.translateString(
						`decktracker.overlay.mulligan.deck-mulligan-filter-rank-bracket-tooltip`,
						{
							rankBracket: rankInfo,
						},
					)!,
			),
		);
		this.opponentLabel$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) =>
					this.i18n.translateString(`app.decktracker.meta.matchup-vs-tooltip`, {
						className: this.i18n.translateString(`global.class.${prefs.decktrackerOocMulliganOpponent}`),
					})!,
			),
		);
		this.opponentTooltip$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => this.i18n.translateString(`global.class.${prefs.decktrackerOocMulliganOpponent}`)),
			this.mapData(
				(opponentInfo) =>
					this.i18n.translateString(`decktracker.overlay.mulligan.deck-mulligan-filter-opponent-tooltip`, {
						opponent: opponentInfo,
					})!,
			),
		);

		this.playCoinLabel$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) =>
					this.i18n.translateString(
						`app.decktracker.meta.details.cards.play-coin-filter.${
							prefs.decktrackerMulliganPlayCoinOoc ?? 'all'
						}`,
					)!,
			),
		);
		this.playCoinTooltip$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) =>
					this.i18n.translateString(
						`decktracker.overlay.mulligan.deck-mulligan-filter-play-coin-tooltip.${
							prefs.decktrackerMulliganPlayCoinOoc ?? 'all'
						}`,
					)!,
			),
		);
		this.timeLabel$ = this.prefs.preferences$$.pipe(
			this.mapData(
				(prefs) =>
					this.i18n.translateString(`app.decktracker.filters.time-filter.${prefs.decktrackerMulliganTime}`)!,
			),
		);
		this.timeTooltip$ = combineLatest([
			this.patches.currentConstructedMetaPatch$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.decktrackerMulliganTime)),
		]).pipe(
			this.mapData(([patch, pref]) => {
				const patchInfo = pref === 'last-patch' ? formatPatch(patch, this.i18n) : '';
				const timeFrame = this.i18n.translateString(`app.decktracker.filters.time-filter.${pref}`);
				return { timeFrame, patchInfo };
			}),
			this.mapData(
				({ timeFrame, patchInfo }) =>
					this.i18n.translateString(`decktracker.overlay.mulligan.deck-mulligan-filter-time-tooltip`, {
						timeFrame: timeFrame,
						patchDetails: patchInfo,
					})!,
			),
		);
		this.formatLabel$ = this.allDeckMulliganInfo$.pipe(
			this.mapData((mulliganInfo) => this.i18n.translateString(`global.format.${mulliganInfo.format}`)!),
		);
		this.sampleSize$ = this.allDeckMulliganInfo$.pipe(
			this.mapData(
				(mulliganInfo) =>
					this.i18n.translateString(`app.decktracker.filters.sample-size-filter`, {
						value: mulliganInfo.sampleSize.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
					})!,
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		await this.prefs.isReady();

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	cycleRanks = async () => {
		const prefs = await this.prefs.getPreferences();
		const currentRank = prefs.decktrackerMulliganRankBracket;
		// Build an array based on all the possible values of the decktrackerMulliganRankBracket type
		const ranks: ('competitive' | 'top-2000-legend' | 'legend' | 'legend-diamond' | 'all')[] = [
			'competitive',
			'top-2000-legend',
			'legend',
			'legend-diamond',
			'all',
		];
		const nextRank = ranks[(ranks.indexOf(currentRank) + 1) % ranks.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerMulliganRankBracket: nextRank,
		};
		await this.prefs.savePreferences(newPrefs);
	};

	cycleOpponent = async () => {
		const prefs = await this.prefs.getPreferences();
		const currentOpponent = prefs.decktrackerOocMulliganOpponent;
		const options = ['all', ...ALL_CLASSES];
		const nextOpponent = options[(options.indexOf(currentOpponent) + 1) % options.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerOocMulliganOpponent: nextOpponent,
		};
		console.debug('[mulligan] cycling opponent', currentOpponent, nextOpponent, options);
		await this.prefs.savePreferences(newPrefs);
	};

	cyclePlayCoin = async () => {
		const prefs = await this.prefs.getPreferences();
		const currentFormat = prefs.decktrackerMulliganPlayCoinOoc ?? 'all';
		const options: readonly ('play' | 'coin' | 'all')[] = ['play', 'coin', 'all'];
		const nextPlayCoin = options[(options.indexOf(currentFormat) + 1) % options.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerMulliganPlayCoinOoc: nextPlayCoin,
		};
		await this.prefs.savePreferences(newPrefs);
	};

	cycleTime = async () => {
		const prefs = await this.prefs.getPreferences();
		const currentOpponent = prefs.decktrackerMulliganTime;
		const options: readonly ('last-patch' | 'past-3' | 'past-7')[] = ['last-patch', 'past-3', 'past-7'];
		const nextTime = options[(options.indexOf(currentOpponent) + 1) % options.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerMulliganTime: nextTime,
		};
		await this.prefs.savePreferences(newPrefs);
	};

	cycleFormat = async () => {
		const prefs = await this.prefs.getPreferences();
		const currentFormat = prefs.decktrackerMulliganFormatOverride ?? GameFormat.FT_STANDARD;
		const options: readonly GameFormat[] = [GameFormat.FT_STANDARD, GameFormat.FT_WILD];
		const nextFormat = options[(options.indexOf(currentFormat) + 1) % options.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerMulliganFormatOverride: nextFormat,
		};
		console.debug('[mulligan] cycling format', currentFormat, nextFormat, options);
		await this.prefs.savePreferences(newPrefs);
	};
}

export interface MulliganDeckDataWithDeckStats extends MulliganDeckData {
	globalDeckStats: MulliganDeckStats;
	playerDeckStats: MulliganDeckStats;
}
