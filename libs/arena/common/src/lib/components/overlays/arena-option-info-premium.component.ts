/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Inject,
	Input,
	ViewRef,
} from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import {
	ADS_SERVICE_TOKEN,
	AnalyticsService,
	IAdsService,
	OverwolfService,
	waitForReady,
} from '@firestone/shared/framework/core';
import { BehaviorSubject, combineLatest, Observable, startWith } from 'rxjs';

@Component({
	selector: 'arena-option-info-premium',
	styleUrls: ['./arena-option-info-premium.component.scss'],
	template: `
		<ng-container *ngIf="show$ | async">
			<div
				class="info-premium"
				[ngClass]="{ extended: extended }"
				(click)="showPremium()"
				[helpTooltip]="showTooltip ? ('app.arena.draft.locked-premium-info-tooltip' | fsTranslate) : null"
			>
				<div class="extended-info">
					<div class="logo" inlineSVG="assets/svg/firestone_logo_no_text.svg"></div>
					<div class="title">Firestone</div>
				</div>
				<div class="container">
					<div class="premium-lock">
						<svg>
							<use xlink:href="assets/svg/sprite.svg#lock" />
						</svg>
					</div>
					<div class="text" [fsTranslate]="'app.arena.draft.locked-premium-info'"></div>
				</div>
				<div
					class="hide-banner-button"
					*ngIf="conditionalOnField$$ | async"
					inlineSVG="assets/svg/close.svg"
					(click)="hidePremium($event)"
					[helpTooltip]="'app.arena.draft.remove-locked-premium-info-tooltip' | fsTranslate"
					[helpTooltipClasses]="'premium'"
				></div>
			</div>
		</ng-container>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaOptionInfoPremiumComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	show$!: Observable<boolean>;

	@Input() extended: boolean;
	@Input() showTooltip: boolean;

	@Input() set conditionalOnField(value: keyof Preferences | null) {
		this.conditionalOnField$$.next(value);
	}

	conditionalOnField$$ = new BehaviorSubject<keyof Preferences | null>(null);

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly analytics: AnalyticsService,
		private readonly prefs: PreferencesService,
		@Inject(ADS_SERVICE_TOKEN) private readonly ads: IAdsService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		this.show$ = combineLatest([this.conditionalOnField$$, this.prefs.preferences$$]).pipe(
			this.mapData(([field, prefs]) => (!field ? true : prefs[field] === true)),
			startWith(false),
		);

		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	hidePremium(event: MouseEvent) {
		event.preventDefault();
		event.stopPropagation();
		this.prefs.updatePrefs(this.conditionalOnField$$.value!, false);
	}

	showPremium() {
		console.debug('show premium');
		this.analytics.trackEvent('subscription-click', { page: 'arena-card-pick' });
		this.ads.goToPremium();
	}
}
