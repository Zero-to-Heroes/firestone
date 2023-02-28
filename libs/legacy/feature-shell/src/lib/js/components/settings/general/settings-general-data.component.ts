import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { IOption } from 'ng-select';
import { BehaviorSubject, Observable } from 'rxjs';
import { AchievementsFullRefreshEvent } from '../../../services/mainwindow/store/events/achievements/achievements-full-refresh-event';
import { CollectionRefreshPacksEvent } from '../../../services/mainwindow/store/events/collection/colection-refresh-packs-event';
import { GamesFullClearEvent } from '../../../services/mainwindow/store/events/stats/game-stats-full-clear-event';
import { GamesFullRefreshEvent } from '../../../services/mainwindow/store/events/stats/game-stats-full-refresh-event';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { sortByProperties } from '../../../services/utils';
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
		</div>

		<div class="settings-group general-data">
			<h3 class="remote-data" [owTranslate]="'settings.general.data.games-title'"></h3>
			<div class="games-synced">{{ gamesSynced$ | async }}</div>
			<preferences-dropdown
				field="replaysLoadPeriod"
				[label]="'settings.general.data.games-period' | owTranslate"
				[options]="gamesPeriodOptions"
				advancedSetting
			></preferences-dropdown>
			<div class="resync games">
				<button
					(mousedown)="refreshGames()"
					[ngClass]="{ busy: isRefreshingGames$ | async }"
					[helpTooltip]="'settings.general.data.games-tooltip' | owTranslate"
				>
					<span> {{ refreshGamesLabel$ | async }}</span>
				</button>
				<button
					(mousedown)="clearGames()"
					[helpTooltip]="'settings.general.data.clear-games-tooltip' | owTranslate"
				>
					<span> {{ clearGamesLabel$ | async }}</span>
				</button>
			</div>
		</div>

		<div class="settings-group general-data">
			<h3 class="remote-data" [owTranslate]="'settings.general.data.other-title'"></h3>
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
	refreshGamesLabel$: Observable<string>;
	isRefreshingGames$: Observable<boolean>;
	clearGamesLabel$: Observable<string>;
	refreshPacksLabel$: Observable<string>;
	isRefreshingPacks$: Observable<boolean>;
	refreshAchievementsLabel$: Observable<string>;
	isRefreshingAchievements$: Observable<boolean>;

	gamesSynced$: Observable<string>;

	gamesPeriodOptions: IOption[] = ['all-time', 'past-100', 'last-patch', 'past-7', 'season-start']
		.map((value) => ({
			value: value,
			label: this.i18n.translateString(`settings.general.data.games-period-options.${value}`) ?? '',
		}))
		.sort(sortByProperties((o) => [o.label]));

	private isRefreshingGames = new BehaviorSubject<boolean>(false);
	private isClearingGames = new BehaviorSubject<boolean>(false);
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
		this.isRefreshingGames$ = this.isRefreshingGames.asObservable();
		this.refreshGamesLabel$ = this.isRefreshingGames$.pipe(
			this.mapData((flag) => {
				return flag
					? this.i18n.translateString('settings.general.data.refresh-progress-button-label')
					: this.i18n.translateString('settings.general.data.refresh-button-label');
			}),
		);
		this.clearGamesLabel$ = this.isClearingGames.pipe(
			this.mapData((flag) => {
				return flag
					? this.i18n.translateString('settings.general.data.refresh-progress-button-label')
					: this.i18n.translateString('settings.general.data.clear-button-label');
			}),
		);

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
			.listen$(([main, nav]) => main.stats?.gameStats)
			.pipe(this.mapData(([gameStats]) => gameStats))
			.subscribe((gameStats) => {
				this.isRefreshingGames.next(false);
				this.isClearingGames.next(false);
			});
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

		this.gamesSynced$ = this.store
			.listen$(([main]) => main.stats?.gameStats?.stats?.length)
			.pipe(
				this.mapData(([totalGames]) =>
					this.i18n.translateString('settings.general.data.total-games', {
						value: totalGames,
					}),
				),
			);
	}

	refreshGames() {
		this.isRefreshingGames.next(true);
		this.store.send(new GamesFullRefreshEvent());
	}

	clearGames() {
		this.isClearingGames.next(true);
		this.store.send(new GamesFullClearEvent());
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
