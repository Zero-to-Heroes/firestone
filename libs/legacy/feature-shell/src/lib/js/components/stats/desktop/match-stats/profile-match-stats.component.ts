// import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
// import { CardClass } from '@firestone-hs/reference-data';
// import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
// import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
// import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
// import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';
// import { ClassInfo, ModeOverview } from './profile-match-stats.model';

// @Component({
// 	selector: 'profile-match-stats',
// 	styleUrls: [`../../../../css/component/stats/desktop/profile-match-stats.component.scss`],
// 	template: `
// 		<div class="player-match-stats">
// 			<div class="mode-selection">
// 				<profile-match-stats-mode-overview
// 					*ngFor="let overview of modeOverviews$ | async"
// 					[overview]="overview"
// 					[active]="overview.mode === currentMode$ | async"
// 					(click)="selectMode(overview.mode)"
// 				>
// 				</profile-match-stats-mode-overview>
// 			</div>
// 			<div class="content">
// 				<div class="stats-header">
// 					<div class="player-class"></div>
// 					<div class="total-matches">Total matches</div>
// 					<div class="winrate">Winrate</div>
// 					<div class="wins">Wins</div>
// 					<div class="losses">Losses</div>
// 				</div>
// 				<div class="stats-content">
// 					<profile-match-stats-class-info
// 						*ngFor="let classInfo of classInfos$ | async"
// 						[classInfo]="classInfo"
// 					>
// 					</profile-match-stats-class-info>
// 				</div>
// 			</div>
// 		</div>
// 	`,
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// export class ProfileMatchStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
// 	modeOverviews$: Observable<readonly ModeOverview[]>;
// 	currentMode$: Observable<'constructed' | 'duels' | 'arena'>;
// 	classInfos$: Observable<readonly ClassInfo[]>;

// 	private currentMode$$ = new BehaviorSubject<'constructed' | 'duels' | 'arena'>('constructed');

// 	constructor(
// 		protected readonly store: AppUiStoreFacadeService,
// 		protected readonly cdr: ChangeDetectorRef,
// 		private readonly i18n: LocalizationFacadeService,
// 	) {
// 		super(store, cdr);
// 	}

// 	ngAfterContentInit() {
// 		this.currentMode$ = this.currentMode$$.asObservable();
// 		this.classInfos$ = combineLatest([this.store.profileClassesProgress$(), this.currentMode$]).pipe(
// 			this.mapData(([classProgress, currentMode]) => {
// 				const result: readonly ClassInfo[] = classProgress.map((info) => {
// 					const lowerCaseClass = CardClass[info.playerClass]?.toLowerCase();
// 					const gamesForMode = info.winsForModes.find((info) => info.mode === currentMode);
// 					const classInfo: ClassInfo = {
// 						playerClass: info.playerClass,
// 						icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${lowerCaseClass}.png`,
// 						name: this.i18n.translateString(`global.class.${lowerCaseClass}`),
// 						totalMatches: gamesForMode.losses + gamesForMode.wins + gamesForMode.ties,
// 						wins: gamesForMode.wins,
// 						losses: gamesForMode.losses,
// 						winrate:
// 							gamesForMode.wins + gamesForMode.losses === 0
// 								? 0
// 								: Math.round((gamesForMode.wins / (gamesForMode.wins + gamesForMode.losses)) * 100),
// 					};
// 					return classInfo;
// 				});
// 				return result;
// 			}),
// 		);

// 		this.modeOverviews$ = this.store.profileClassesProgress$().pipe(
// 			this.mapData(
// 				(classProgress) => {
// 					const modes = ['constructed', 'arena'] as const;
// 					return modes.map((mode) => {
// 						const wins = classProgress
// 							.map((info) => info.winsForModes.find((info) => info.mode === mode).wins)
// 							.reduce((a, b) => a + b, 0);
// 						const losses = classProgress
// 							.map((info) => info.winsForModes.find((info) => info.mode === mode).losses)
// 							.reduce((a, b) => a + b, 0);
// 						// const ties = classProgress
// 						// 	.map((info) => info.winsForModes.find((info) => info.mode === mode).ties)
// 						// 	.reduce((a, b) => a + b, 0);
// 						const result: ModeOverview = {
// 							mode: mode,
// 							title: this.i18n.translateString(`global.game-mode.ranked.${mode}`),
// 							wins: wins,
// 							losses: losses,
// 							winrate: wins + losses === 0 ? 0 : Math.round((wins / (wins + losses)) * 100),
// 						};
// 						return result;
// 					});
// 				},
// 				// classProgress.map((info) => ({
// 				// 	mode: info.mode,
// 				// 	title: this.i18n.translateString(`global.game-mode.ranked.${info.mode}`),
// 				// 	wins: info.wins,
// 				// 	losses: info.losses,
// 				// 	winrate:
// 				// 		(info.wins + info.losses === 0
// 				// 			? 0
// 				// 			: Math.round((info.wins / (info.wins + info.losses)) * 100)) + '%',
// 				// })),
// 			),
// 		);
// 	}

// 	selectMode(mode: 'constructed' | 'duels' | 'arena') {
// 		this.currentMode$$.next(mode);
// 	}
// }
