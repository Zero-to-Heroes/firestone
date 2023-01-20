import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { AchievementsFullRefreshEvent } from '../../../services/mainwindow/store/events/achievements/achievements-full-refresh-event';
import { CollectionRefreshPacksEvent } from '../../../services/mainwindow/store/events/collection/colection-refresh-packs-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../abstract-subscription-store.component';

@Component({
	selector: 'settings-general-data',
	styleUrls: [
		`../../../../css/global/forms.scss`,
		`../../../../css/component/settings/settings-common.component.scss`,
		`../../../../css/component/settings/general/settings-general-data.component.scss`,
	],
	template: `
		<div class="settings-group general-data">
			<h2 class="remote-data" [owTranslate]="'settings.general.data.remote-title'"></h2>
			<p [owTranslate]="'settings.general.data.remote-intro-text'"></p>
			<div class="resync packs">
				<div class="label" [owTranslate]="'settings.general.data.packs'"></div>
				<button
					(mousedown)="refreshPacks()"
					[ngClass]="{ busy: isRefreshingPacks$ | async }"
					[helpTooltip]="'settings.general.data.packs-tooltip' | owTranslate"
				>
					<span> {{ refreshPacksLabel$ | async }}</span>
				</button>
			</div>
			<div class="resync achievements">
				<div class="label" [owTranslate]="'settings.general.data.achievements'"></div>
				<button
					(mousedown)="refreshAchievements()"
					[ngClass]="{ busy: isRefreshingAchievements$ | async }"
					[helpTooltip]="'settings.general.data.achievements-tooltip' | owTranslate"
				>
					<span> {{ refreshAchievementsLabel$ | async }}</span>
				</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsGeneralDataComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	refreshPacksLabel$: Observable<string>;
	isRefreshingPacks$: Observable<boolean>;
	refreshAchievementsLabel$: Observable<string>;
	isRefreshingAchievements$: Observable<boolean>;

	private isRefreshingPacks = new BehaviorSubject<boolean>(false);
	private isRefreshingAchievements = new BehaviorSubject<boolean>(false);

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit(): void {
		this.isRefreshingPacks$ = this.isRefreshingPacks.asObservable();
		this.refreshPacksLabel$ = this.isRefreshingPacks$.pipe(
			this.mapData((flag) => {
				return flag
					? this.i18n.translateString('settings.general.data.refresh-progress-button-label')
					: this.i18n.translateString('settings.general.data.refresh-button-label');
			}),
		);
		this.isRefreshingAchievements$ = this.isRefreshingAchievements.asObservable();
		this.refreshAchievementsLabel$ = this.isRefreshingAchievements$.pipe(
			this.mapData((flag) => {
				return flag
					? this.i18n.translateString('settings.general.data.refresh-progress-button-label')
					: this.i18n.translateString('settings.general.data.refresh-button-label');
			}),
		);
		this.store
			.listen$(([main, nav]) => main.binder.packStats)
			.pipe(this.mapData(([packs]) => packs))
			.subscribe((packs) => {
				this.isRefreshingPacks.next(false);
			});
		this.store
			.listen$(([main, nav]) => main.achievements.categories)
			.pipe(this.mapData(([categories]) => categories))
			.subscribe((categories) => {
				this.isRefreshingAchievements.next(false);
			});
	}

	refreshPacks() {
		this.isRefreshingPacks.next(true);
		this.store.send(new CollectionRefreshPacksEvent());
	}

	refreshAchievements() {
		this.isRefreshingAchievements.next(true);
		this.store.send(new AchievementsFullRefreshEvent());
	}
}
