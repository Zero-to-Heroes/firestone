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
import { CardClass, GameFormat, formatFormatReverse, getBaseCardId } from '@firestone-hs/reference-data';
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
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	shareReplay,
	takeUntil,
} from 'rxjs';
import { MulliganDeckData } from '../models/mulligan-advice';
import { ConstructedMulliganGuideGuardianService } from '../services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from '../services/constructed-mulligan-guide.service';
import { buildColor } from './mulligan-deck-view.component';

@Component({
	selector: 'constructed-mulligan-deck',
	styleUrls: ['./constructed-mulligan-deck.component.scss'],
	template: `
		<mulligan-deck-view
			[deckMulliganInfo]="allDeckMulliganInfo$ | async"
			[showMulliganOverview]="showMulliganOverview$ | async"
			[showFilters]="true"
			[showArchetypeSelection]="true"
			[rankBracketTooltip]="rankBracketTooltip$ | async"
			[rankBracketLabel]="rankBracketLabel$ | async"
			[opponentTooltip]="opponentTooltip$ | async"
			[opponentLabel]="opponentLabel$ | async"
			[timeTooltip]="timeTooltip$ | async"
			[timeLabel]="timeLabel$ | async"
			[formatLabel]="formatLabel$ | async"
			[sampleSize]="sampleSize$ | async"
			[cycleRanks]="cycleRanks"
			[cycleOpponent]="cycleOpponent"
			[cycleTime]="cycleTime"
			[cycleFormat]="cycleFormat"
		>
		</mulligan-deck-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMulliganDeckComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	allDeckMulliganInfo$: Observable<MulliganDeckData>;
	showMulliganOverview$: Observable<boolean | null>;

	rankBracketLabel$: Observable<string>;
	rankBracketTooltip$: Observable<string>;
	opponentLabel$: Observable<string>;
	opponentTooltip$: Observable<string>;
	timeLabel$: Observable<string>;
	timeTooltip$: Observable<string>;
	formatLabel$: Observable<string>;
	sampleSize$: Observable<string>;

	private opponentActualClass$$ = new BehaviorSubject<string | null>(null);

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
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameState, this.ads, this.guardian, this.prefs, this.patches);

		const showWidget$ = combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$]).pipe(
			debounceTime(200),
			this.mapData(([hasPremiumSub, freeUsesLeft]) => hasPremiumSub || freeUsesLeft > 0),
			distinctUntilChanged(),
		);
		this.showMulliganOverview$ = combineLatest([
			showWidget$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.decktrackerShowMulliganDeckOverview)),
		]).pipe(this.mapData(([showWidget, showMulliganOverview]) => showWidget && showMulliganOverview));

		this.allDeckMulliganInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((guide) => {
				const result: MulliganDeckData = {
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
						className: this.i18n.translateString(`global.class.${prefs.decktrackerMulliganOpponent}`),
					})!,
			),
		);
		this.opponentTooltip$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => this.i18n.translateString(`global.class.${prefs.decktrackerMulliganOpponent}`)),
			this.mapData(
				(opponentInfo) =>
					this.i18n.translateString(`decktracker.overlay.mulligan.deck-mulligan-filter-opponent-tooltip`, {
						opponent: opponentInfo,
					})!,
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
		this.gameState.gameState$$
			.pipe(
				this.mapData((gameState) =>
					CardClass[gameState?.opponentDeck?.hero?.classes?.[0] ?? CardClass.NEUTRAL].toLowerCase(),
				),
			)
			.subscribe(this.opponentActualClass$$);

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
		const currentOpponent = prefs.decktrackerMulliganOpponent;
		const options = ['all', this.opponentActualClass$$.value ?? 'all'];
		const nextOpponent = options[(options.indexOf(currentOpponent) + 1) % options.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerMulliganOpponent: nextOpponent,
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
		const currentFormat =
			prefs.decktrackerMulliganFormatOverride ??
			formatFormatReverse(this.mulligan.mulliganAdvice$$.value!.format);
		const options: readonly GameFormat[] = [GameFormat.FT_STANDARD, GameFormat.FT_WILD];
		const nextFormat = options[(options.indexOf(currentFormat) + 1) % options.length];
		const newPrefs: Preferences = {
			...prefs,
			decktrackerMulliganFormatOverride: nextFormat,
		};
		await this.prefs.savePreferences(newPrefs);
	};
}
