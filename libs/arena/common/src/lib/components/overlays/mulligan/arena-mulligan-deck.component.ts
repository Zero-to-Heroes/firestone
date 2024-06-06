/* eslint-disable @angular-eslint/template/no-negated-async */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { CardClass, getBaseCardId } from '@firestone-hs/reference-data';
import { MulliganDeckData, buildColor } from '@firestone/constructed/common';
import { GameStateFacadeService } from '@firestone/game-state';
import { PatchesConfigService, Preferences, PreferencesService, formatPatch } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent, sleep } from '@firestone/shared/framework/common';
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
	tap,
} from 'rxjs';
import { ArenaMulliganGuideGuardianService } from '../../../services/arena-mulligan-guide-guardian.service';
import { ArenaMulliganGuideService } from '../../../services/arena-mulligan-guide.service';

@Component({
	selector: 'arena-mulligan-deck',
	styleUrls: ['./arena-mulligan-deck.component.scss'],
	template: `
		<mulligan-deck-view
			[deckMulliganInfo]="allDeckMulliganInfo$ | async"
			[showMulliganOverview]="showMulliganOverview$ | async"
			[sampleSize]="sampleSize$ | async"
			[opponentTooltip]="opponentTooltip$ | async"
			[opponentLabel]="opponentLabel$ | async"
			[timeTooltip]="timeTooltip$ | async"
			[timeLabel]="timeLabel$ | async"
			[cycleOpponent]="cycleOpponent"
			[cycleTime]="cycleTime"
		>
		</mulligan-deck-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaMulliganDeckComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, AfterViewInit
{
	allDeckMulliganInfo$: Observable<MulliganDeckData | null>;
	showMulliganOverview$: Observable<boolean | null>;
	sampleSize$: Observable<string>;
	opponentLabel$: Observable<string>;
	opponentTooltip$: Observable<string>;
	timeLabel$: Observable<string>;
	timeTooltip$: Observable<string>;

	private opponentActualClass$$ = new BehaviorSubject<string | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly gameState: GameStateFacadeService,
		private readonly mulligan: ArenaMulliganGuideService,
		private readonly guardian: ArenaMulliganGuideGuardianService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
		private readonly el: ElementRef,
		private readonly renderer: Renderer2,
		private readonly allCards: CardsFacadeService,
		private readonly patches: PatchesConfigService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.gameState, this.ads, this.guardian, this.prefs, this.patches);

		const showWidget$ = combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$]).pipe(
			debounceTime(200),
			tap((info) => console.debug('[mulligan] showWidget', info)),
			this.mapData(([hasPremiumSub, freeUsesLeft]) => hasPremiumSub || freeUsesLeft > 0),
			distinctUntilChanged(),
		);
		this.showMulliganOverview$ = combineLatest([
			showWidget$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.decktrackerShowMulliganDeckOverview)),
		]).pipe(
			tap((info) => console.debug('[mulligan] showMulliganOverview', info)),
			this.mapData(([showWidget, showMulliganOverview]) => showWidget && showMulliganOverview),
		);

		this.allDeckMulliganInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((guide) => {
				const result: MulliganDeckData = {
					mulliganData: guide!.allDeckCards.map((advice) => ({
						cardId: advice.cardId,
						label: advice.cardId,
						value: advice.score ?? 0,
						keepRate: 100 * (advice.keepRate ?? 0),
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
			tap((info) => console.debug('[mulligan] mulliganInfo', info)),
			takeUntil(this.destroyed$),
		);

		this.sampleSize$ = this.allDeckMulliganInfo$.pipe(
			this.mapData(
				(mulliganInfo) =>
					this.i18n.translateString(`app.decktracker.filters.sample-size-filter`, {
						value: mulliganInfo?.sampleSize.toLocaleString(this.i18n.formatCurrentLocale() ?? 'enUS'),
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
			this.patches.currentArenaMetaPatch$$,
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
						patchInfo: patchInfo,
					})!,
			),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	async ngAfterViewInit() {
		await this.prefs.isReady();

		this.prefs.preferences$$
			.pipe(
				this.mapData((prefs) => prefs.decktrackerMulliganScale),
				filter((pref) => !!pref),
				distinctUntilChanged(),
				takeUntil(this.destroyed$),
			)
			.subscribe(async (scale) => {
				const newScale = scale / 100;
				const elements = await this.getScalableElements();
				console.debug('[mulligan] setting scale 2', newScale, elements);
				elements.forEach((element) => this.renderer.setStyle(element, 'transform', `scale(${newScale})`));
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

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

	private async getScalableElements(): Promise<HTMLElement[]> {
		let elements = this.el.nativeElement.querySelectorAll('.scalable');
		let retriesLeft = 10;
		while (retriesLeft >= 0 && elements?.length < 3) {
			await sleep(100);
			elements = this.el.nativeElement.querySelectorAll('.scalable');
			retriesLeft--;
		}
		return elements;
	}
}
