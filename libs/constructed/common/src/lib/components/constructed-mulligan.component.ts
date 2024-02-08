/* eslint-disable @angular-eslint/template/no-negated-async */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { ADS_SERVICE_TOKEN, IAdsService, ILocalizationService } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	filter,
	shareReplay,
} from 'rxjs';
import { ConstructedMulliganGuideGuardianService } from '../services/constructed-mulligan-guide-guardian.service';
import { ConstructedMulliganGuideService } from '../services/constructed-mulligan-guide.service';
import { GameStateFacadeService } from '../services/game-state-facade.service';
import { MulliganChartData } from './mulligan-detailed-info.component';

@Component({
	selector: 'constructed-mulligan',
	styleUrls: ['./constructed-mulligan.component.scss'],
	template: `
		<div class="root">
			<ng-container *ngIf="showHandInfo$ | async">
				<ul
					class="mulligan-guide"
					*ngIf="cardsInHandInfo$ | async as cardsInHandInfo"
					[ngClass]="{ wide: cardsInHandInfo.length === 4 }"
				>
					<ng-container *ngIf="(showPremiumBanner$ | async) === false">
						<div class="mulligan-info" *ngFor="let info of cardsInHandInfo">
							<div class="stat mulligan-winrate">
								<span
									class="label"
									[fsTranslate]="'decktracker.overlay.mulligan.mulligan-impact'"
									[helpTooltip]="helpTooltip$ | async"
								></span>
								<span class="value">{{ info.impact }}</span>
							</div>
						</div>
					</ng-container>
					<ng-container *ngIf="showPremiumBanner$ | async">
						<div class="premium-container" *ngFor="let info of cardsInHandInfo">
							<mulligan-info-premium></mulligan-info-premium>
						</div>
					</ng-container>
				</ul>
			</ng-container>
			<div class="mulligan-overview" *ngIf="showMulliganOverview$ | async">
				<mulligan-detailed-info [data]="allDeckMulliganInfo$ | async"></mulligan-detailed-info>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMulliganComponent extends AbstractSubscriptionComponent implements AfterContentInit, OnDestroy {
	cardsInHandInfo$: Observable<readonly InternalMulliganAdvice[] | null>;
	allDeckMulliganInfo$: Observable<MulliganChartData | null>;
	showHandInfo$: Observable<boolean | null>;
	showMulliganOverview$: Observable<boolean | null>;
	showPremiumBanner$: Observable<boolean>;
	helpTooltip$: Observable<string | null>;

	private showPremiumBanner$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly gameState: GameStateFacadeService,
		private readonly mulligan: ConstructedMulliganGuideService,
		private readonly guardian: ConstructedMulliganGuideGuardianService,
		private readonly prefs: PreferencesService,
		private readonly i18n: ILocalizationService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await this.gameState.isReady();
		await this.ads.isReady();
		await this.guardian.isReady();
		await this.prefs.isReady();

		combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$])
			.pipe(
				debounceTime(200),
				this.mapData(([hasPremiumSub, freeUsesLeft]) => hasPremiumSub || freeUsesLeft > 0),
				distinctUntilChanged(),
			)
			.subscribe((showWidget) => this.showPremiumBanner$$.next(!showWidget));
		this.showPremiumBanner$ = this.showPremiumBanner$$.asObservable();
		this.showHandInfo$ = this.prefs
			.preferences$((prefs) => prefs.decktrackerShowMulliganCardImpact)
			.pipe(this.mapData(([showMulliganCardImpact]) => showMulliganCardImpact));
		this.showMulliganOverview$ = combineLatest([
			this.showPremiumBanner$$,
			this.prefs.preferences$((prefs) => prefs.decktrackerShowMulliganDeckOverview),
		]).pipe(
			this.mapData(([showPremiumBanner, [showMulliganOverview]]) => !showPremiumBanner && showMulliganOverview),
		);
		this.helpTooltip$ = combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$]).pipe(
			debounceTime(200),
			this.mapData(([hasPremiumSub, freeUsesLeft]) => {
				if (hasPremiumSub) {
					return this.i18n.translateString('decktracker.overlay.mulligan.mulligan-impact-tooltip-premium');
				}
				return this.i18n.translateString('decktracker.overlay.mulligan.mulligan-impact-tooltip-free', {
					value: freeUsesLeft,
				});
			}),
			distinctUntilChanged(),
			shareReplay(1),
		);
		this.cardsInHandInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((guide) => !!guide),
			this.mapData((guide) => {
				return guide!.cardsInHand
					.map((cardId) => guide?.allDeckCards.find((advice) => advice.cardId === cardId))
					.map((advice) => ({
						impact: advice?.score == null ? '-' : advice.score.toFixed(2),
					}));
			}),
		);
		this.allDeckMulliganInfo$ = this.mulligan.mulliganAdvice$$.pipe(
			filter((advice) => !!advice),
			this.mapData((guide) => {
				return {
					mulliganData: guide!.allDeckCards
						.map((advice) => ({
							cardId: advice.cardId,
							label: advice.cardId,
							value: advice.score ?? 0,
							selected: !!guide?.cardsInHand.includes(advice.cardId),
						}))
						.sort((a, b) => a.value - b.value),
					format: guide!.format,
					sampleSize: guide!.sampleSize,
					rankBracket: guide!.rankBracket,
					opponentClass: guide!.opponentClass,
				};
			}),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	override ngOnDestroy(): void {
		if (!this.showPremiumBanner$$.value) {
			this.guardian.acknowledgeMulliganAdviceSeen();
		}
	}
}

interface InternalMulliganAdvice {
	impact: string;
}
