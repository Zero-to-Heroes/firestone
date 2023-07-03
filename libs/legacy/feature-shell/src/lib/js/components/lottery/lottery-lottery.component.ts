import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { OverwolfService } from '@firestone/shared/framework/core';
import { Observable, combineLatest } from 'rxjs';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { LotteryConfigResourceStatType } from '../../services/lottery/lottery.model';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'lottery-lottery',
	styleUrls: [
		'../../../css/component/lottery/lottery-section.scss',
		'../../../css/component/lottery/lottery-lottery.component.scss',
	],
	template: `
		<div class="main-content">
			<div class="header">
				<div class="points">
					<div class="value">{{ totalPoints$ | async }}</div>
					<div class="text" [owTranslate]="'app.lottery.lottery.points-text'"></div>
				</div>
				<div class="account">
					<ng-container [ngSwitch]="loggedIn$ | async">
						<div class="sign-in" *ngSwitchCase="false">
							<button
								class="button"
								[owTranslate]="'app.lottery.lottery.sign-in-button-text'"
								[helpTooltip]="'app.lottery.lottery.sign-in-button-tooltip' | owTranslate"
								[helpTooltipClasses]="'general-theme'"
								(click)="login()"
							></button>
						</div>
						<div class="account-recap" *ngSwitchCase="true">
							<img class="avatar" [src]="avatarUrl$ | async" />
							<div class="name" [innerHTML]="userName$ | async"></div>
						</div>
					</ng-container>
				</div>
			</div>
			<div class="stats">
				<div class="stat">
					<div
						class="label"
						[innerHTML]="resourcesLabel$ | async"
						[helpTooltip]="resourcesTooltip$ | async"
						[helpTooltipClasses]="'general-theme'"
					></div>
					<div class="value">{{ resourcesValue$ | async }}</div>
				</div>
				<div class="stat">
					<div
						class="label"
						[innerHTML]="battlegroundsLabel$ | async"
						[helpTooltip]="battlegroundsTooltip$ | async"
						[helpTooltipClasses]="'general-theme'"
					></div>
					<div class="value">{{ battlegroundsValue$ | async }}</div>
				</div>
				<div class="stat">
					<div
						class="label"
						[innerHTML]="constructedLabel$ | async"
						[helpTooltip]="constructedTooltip$ | async"
						[helpTooltipClasses]="'general-theme'"
					></div>
					<div class="value">{{ constructedValue$ | async }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryLotteryWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	userName$: Observable<string>;
	avatarUrl$: Observable<string>;
	loggedIn$: Observable<boolean>;

	totalPoints$: Observable<string>;

	resourcesValue$: Observable<string>;
	resourcesLabel$: Observable<string>;
	resourcesTooltip$: Observable<string>;

	battlegroundsValue$: Observable<string>;
	battlegroundsLabel$: Observable<string>;
	battlegroundsTooltip$: Observable<string>;

	constructedValue$: Observable<string>;
	constructedLabel$: Observable<string>;
	constructedTooltip$: Observable<string>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly ow: OverwolfService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.userName$ = this.store
			.listen$(([main, nav, prefs]) => main.currentUser)
			.pipe(this.mapData(([currentUser]) => currentUser?.username));
		this.loggedIn$ = this.userName$.pipe(this.mapData((userName) => !!userName));
		this.avatarUrl$ = this.store
			.listen$(([main, nav, prefs]) => main.currentUser)
			.pipe(this.mapData(([currentUser]) => currentUser?.avatar ?? 'assets/images/social-share-login.png'));

		this.totalPoints$ = this.store
			.lottery$()
			.pipe(this.mapData((lottery) => lottery.currentPoints().toLocaleString(this.i18n.formatCurrentLocale())));

		const resourceStatKey$ = this.store.lottery$().pipe(this.mapData((lottery) => lottery.resourceStatKey()));
		[this.resourcesValue$, this.resourcesLabel$, this.resourcesTooltip$] = this.lotteryInfo(resourceStatKey$);

		const battlegroundsStatsKey$ = this.store
			.lottery$()
			.pipe(this.mapData((lottery) => lottery.battlegroundsStatKey()));
		[this.battlegroundsValue$, this.battlegroundsLabel$, this.battlegroundsTooltip$] =
			this.lotteryInfo(battlegroundsStatsKey$);

		const constructedStatKey$ = this.store.lottery$().pipe(this.mapData((lottery) => lottery.constructedStatKey()));
		[this.constructedValue$, this.constructedLabel$, this.constructedTooltip$] =
			this.lotteryInfo(constructedStatKey$);
	}

	login() {
		this.ow.openLoginDialog();
	}

	private lotteryInfo(
		statKey$: Observable<LotteryConfigResourceStatType>,
	): [Observable<string>, Observable<string>, Observable<string>] {
		return [
			combineLatest([statKey$, this.store.lottery$()]).pipe(
				this.mapData(([statKey, lottery]) =>
					lottery.statValue(statKey).toLocaleString(this.i18n.formatCurrentLocale()),
				),
			),
			statKey$.pipe(this.mapData((key) => this.i18n.translateString(`app.lottery.lottery.stats.${key}-label`))),
			combineLatest([statKey$, this.store.lottery$()]).pipe(
				this.mapData(([key, lottery]) =>
					this.i18n.translateString(`app.lottery.lottery.stats.${key}-tooltip`, {
						pointsGained: lottery.pointsGainedForStat(key),
					}),
				),
			),
		];
	}
}
