import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { AbstractSubscriptionStoreComponent } from '@components/abstract-subscription-store.component';
import { Observable } from 'rxjs';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';

@Component({
	selector: 'lottery-lottery',
	styleUrls: [
		'../../../css/component/lottery/lottery-section.scss',
		'../../../css/component/lottery/lottery-lottery.component.scss',
	],
	template: `
		<div class="main-content">
			<div class="title">
				<div class="text" [owTranslate]="'app.lottery.title'"></div>
				<div class="value">{{ totalPoints$ | async }}</div>
			</div>
			<div class="stats">
				<div class="stat">
					<div
						class="label"
						[owTranslate]="'app.lottery.resources'"
						[helpTooltip]="'app.lottery.resources-tooltip' | translate"
					></div>
					<div class="value">{{ resources$ | async }}</div>
				</div>
				<div class="stat">
					<div
						class="label"
						[owTranslate]="'app.lottery.quilboars'"
						[helpTooltip]="'app.lottery.quilboars-tooltip' | translate"
					></div>
					<div class="value">{{ quilboars$ | async }}</div>
				</div>
				<div class="stat">
					<div
						class="label"
						[owTranslate]="'app.lottery.spells'"
						[helpTooltip]="'app.lottery.spells-tooltip' | translate"
					></div>
					<div class="value">{{ spells$ | async }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LotteryLotteryWidgetComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	totalPoints$: Observable<string>;
	resources$: Observable<string>;
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
		this.resources$ = this.store
			.lottery$()
			.pipe(
				this.mapData((lottery) =>
					(lottery.totalResourcesUsed + lottery.resourcesUsedThisTurn).toLocaleString(
						this.i18n.formatCurrentLocale(),
					),
				),
			);
		this.quilboars$ = this.store
			.lottery$()
			.pipe(this.mapData((lottery) => lottery.quilboardsPlayed.toLocaleString(this.i18n.formatCurrentLocale())));
		this.spells$ = this.store
			.lottery$()
			.pipe(this.mapData((lottery) => lottery.spellsPlayed.toLocaleString(this.i18n.formatCurrentLocale())));
	}
}
