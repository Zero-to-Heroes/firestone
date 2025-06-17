/* eslint-disable @typescript-eslint/no-empty-function */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	ElementRef,
	Inject,
	OnDestroy,
	Renderer2,
	ViewRef,
} from '@angular/core';
import { BgsInGameTrinketsGuardianService, BgsInGameTrinketsService } from '@firestone/battlegrounds/common';
import { BgsTrinketCardChoiceOption } from '@firestone/game-state';
import { CardChoicesService } from '@firestone/memory';
import { PreferencesService } from '@firestone/shared/common/service';
import { ADS_SERVICE_TOKEN, IAdsService, OverwolfService, waitForReady } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	pairwise,
	takeUntil,
} from 'rxjs';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'choosing-bgs-trinket-widget-wrapper',
	styleUrls: ['./choosing-bgs-trinket-widget-wrapper.component.scss'],
	template: `
		<div class="container" *ngIf="showWidget$ | async">
			<div
				class="choosing-card-container items-{{ value.options?.length }}"
				*ngIf="{ options: options$ | async } as value"
			>
				<ng-container *ngIf="(showPremiumBanner$ | async) === false">
					<choosing-card-bgs-trinket-option
						class="option-container"
						*ngFor="let option of value.options"
						[option]="option"
						[freeUsesLeft]="freeUsesLeft$ | async"
					></choosing-card-bgs-trinket-option>
				</ng-container>
				<!-- <ng-container *ngIf="showPremiumBanner$ | async">
					<div class="premium-container" *ngFor="let option of value.options">
						<bgs-trinket-stats-info-premium></bgs-trinket-stats-info-premium>
					</div>
				</ng-container> -->
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingBgsTrinketWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit, OnDestroy
{
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	options$: Observable<readonly BgsTrinketCardChoiceOption[]>;
	showPremiumBanner$: Observable<boolean>;
	freeUsesLeft$: Observable<number>;

	windowWidth: number;
	windowHeight: number;

	private showPremiumBanner$$ = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly ow: OverwolfService,
		protected readonly el: ElementRef,
		protected readonly prefs: PreferencesService,
		protected readonly renderer: Renderer2,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly trinkets: BgsInGameTrinketsService,
		private readonly guardian: BgsInGameTrinketsGuardianService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
		private readonly choices: CardChoicesService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.trinkets, this.ads, this.guardian, this.choices);

		this.showWidget$ = combineLatest([this.trinkets.showWidget$$, this.choices.choicesHidden$$]).pipe(
			this.mapData(([showWidget, hidden]) => (hidden === true ? false : showWidget)),
			this.handleReposition(),
		);
		this.options$ = this.trinkets.trinketStats$$.pipe(this.mapData((options) => options));

		combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$])
			.pipe(
				debounceTime(200),
				this.mapData(([hasPremiumSub, freeUsesLeft]) => hasPremiumSub || freeUsesLeft > 0),
			)
			.subscribe((showWidget) => this.showPremiumBanner$$.next(!showWidget));
		this.showPremiumBanner$ = this.showPremiumBanner$$.asObservable();
		this.freeUsesLeft$ = combineLatest([this.ads.hasPremiumSub$$, this.guardian.freeUsesLeft$$]).pipe(
			debounceTime(200),
			this.mapData(([hasPremiumSub, freeUsesLeft]) => (hasPremiumSub ? 0 : freeUsesLeft)),
		);

		const displayInfo$ = combineLatest([this.showWidget$, this.options$]).pipe(
			this.mapData(([showWidget, options]) => showWidget && !!options?.length),
		);
		displayInfo$
			.pipe(distinctUntilChanged(), pairwise(), takeUntil(this.destroyed$))
			.subscribe(([wasDisplayed, isDisplayed]) => {
				console.debug('[bgs-trinket] widget visibility changed', wasDisplayed, isDisplayed);
				if (wasDisplayed && !isDisplayed) {
					if (!this.showPremiumBanner$$.value) {
						this.guardian.acknowledgeStatsSeen();
					}
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
