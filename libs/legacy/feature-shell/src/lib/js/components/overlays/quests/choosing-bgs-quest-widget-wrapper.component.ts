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
import { BG_USE_QUESTS, BgsInGameQuestsGuardianService, BgsInGameQuestsService } from '@firestone/battlegrounds/common';
import { BgsQuestCardChoiceOption } from '@firestone/game-state';
import { PreferencesService } from '@firestone/shared/common/service';
import { ADS_SERVICE_TOKEN, IAdsService, OverwolfService } from '@firestone/shared/framework/core';
import {
	BehaviorSubject,
	Observable,
	combineLatest,
	debounceTime,
	distinctUntilChanged,
	pairwise,
	takeUntil,
} from 'rxjs';
import { AbstractWidgetWrapperComponent } from '../_widget-wrapper.component';

@Component({
	selector: 'choosing-bgs-quest-widget-wrapper',
	styleUrls: ['./choosing-bgs-quest-widget-wrapper.component.scss'],
	template: `
		<div class="container" *ngIf="showWidget$ | async">
			<div
				class="choosing-card-container items-{{ value.options?.length }}"
				*ngIf="{ options: options$ | async } as value"
			>
				<ng-container *ngIf="(showPremiumBanner$ | async) === false">
					<choosing-card-bgs-quest-option
						class="option-container"
						*ngFor="let option of value.options"
						[option]="option"
						[freeUsesLeft]="freeUsesLeft$ | async"
					></choosing-card-bgs-quest-option>
				</ng-container>
				<!-- <ng-container *ngIf="showPremiumBanner$ | async">
					<div class="premium-container" *ngFor="let option of value.options">
						<bgs-quest-stats-info-premium></bgs-quest-stats-info-premium>
					</div>
				</ng-container> -->
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingBgsQuestWidgetWrapperComponent
	extends AbstractWidgetWrapperComponent
	implements AfterContentInit, OnDestroy
{
	protected defaultPositionLeftProvider = null;
	protected defaultPositionTopProvider = null;
	protected positionUpdater = null;
	protected positionExtractor = null;
	protected getRect = null;

	showWidget$: Observable<boolean>;
	options$: Observable<readonly BgsQuestCardChoiceOption[]>;
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
		protected readonly cdr: ChangeDetectorRef,
		private readonly quests: BgsInGameQuestsService,
		private readonly guardian: BgsInGameQuestsGuardianService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(ow, el, prefs, renderer, cdr);
	}

	async ngAfterContentInit() {
		if (!BG_USE_QUESTS) {
			return;
		}

		await this.quests.isReady();
		await this.ads.isReady();
		await this.guardian.isReady();

		this.showWidget$ = this.quests.showWidget$$.pipe(
			this.mapData((showWidget) => showWidget),
			this.handleReposition(),
		);
		this.options$ = this.quests.questStats$$.pipe(this.mapData((options) => options));

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
				console.debug('[bgs-quest] widget visibility changed', wasDisplayed, isDisplayed);
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
