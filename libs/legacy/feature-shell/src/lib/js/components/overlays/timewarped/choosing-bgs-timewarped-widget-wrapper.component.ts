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
import { BgsInGameTimewarpedGuardianService, BgsInGameTimewarpedService } from '@firestone/battlegrounds/common';
import { BgsTimewarpedCardChoiceOption } from '@firestone/game-state';
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
	standalone: false,
	selector: 'choosing-bgs-timewarped-widget-wrapper',
	styleUrls: ['./choosing-bgs-timewarped-widget-wrapper.component.scss'],
	template: `
		<div class="container" *ngIf="showWidget$ | async">
			<div
				class="choosing-card-container"
				*ngIf="{ options: options$ | async } as value"
			>
				<ng-container *ngIf="(showPremiumBanner$ | async) === false">
					<choosing-card-bgs-timewarped-option
						class="option-container"
						*ngFor="let option of value.options"
						[option]="option"
						[freeUsesLeft]="freeUsesLeft$ | async"
					></choosing-card-bgs-timewarped-option>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingBgsTimewarpedWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit, OnDestroy {
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	options$: Observable<readonly BgsTimewarpedCardChoiceOption[]>;
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
		private readonly timewarped: BgsInGameTimewarpedService,
		private readonly guardian: BgsInGameTimewarpedGuardianService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.timewarped, this.ads, this.guardian);

		this.showWidget$ = this.timewarped.showWidget$$.pipe(
			this.mapData((showWidget) => showWidget),
			this.handleReposition(),
		);
		this.options$ = this.timewarped.timewarpedStats$$.pipe(this.mapData((options) => options));

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
				console.debug('[bgs-timewarped] widget visibility changed', wasDisplayed, isDisplayed);
				if (wasDisplayed && !isDisplayed) {
					if (!this.showPremiumBanner$$.value) {
						this.guardian.acknowledgeStatsSeen();
					}
				}
			});

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}
}
