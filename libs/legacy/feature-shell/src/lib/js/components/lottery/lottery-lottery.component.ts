import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
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

	quilboars$: Observable<string>;
	spells$: Observable<string>;

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
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
