import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { CardClass } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@legacy-import/src/lib/js/services/localization-facade.service';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { AppUiStoreFacadeService } from '../../../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionStoreComponent } from '../../../abstract-subscription-store.component';
import { ClassInfo, ModeOverview } from './profile-match-stats.model';

@Component({
	selector: 'profile-match-stats',
	styleUrls: [
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats-columns.scss`,
		`../../../../../css/component/stats/desktop/match-stats/profile-match-stats.component.scss`,
	],
	template: `
		<div class="player-match-stats" *ngIf="{ currentMode: currentMode$ | async } as value">
			<div class="mode-selection">
				<profile-match-stats-mode-overview
					class="mode-overview"
					*ngFor="let overview of modeOverviews$ | async"
					[overview]="overview"
					[active]="overview.mode === value.currentMode"
					(click)="selectMode(overview.mode)"
				>
				</profile-match-stats-mode-overview>
			</div>
			<div class="content">
				<div class="stats-header">
					<div class="cell player-class"></div>
					<div class="cell winrate">Winrate</div>
					<div class="cell total-matches">Total matches</div>
					<div class="cell wins" *ngIf="value.currentMode !== 'battlegrounds'">Wins</div>
					<div class="cell losses" *ngIf="value.currentMode !== 'battlegrounds'">Losses</div>
					<div class="cell top-1" *ngIf="value.currentMode === 'battlegrounds'">Top 1</div>
					<div class="cell top-4" *ngIf="value.currentMode === 'battlegrounds'">Top 4</div>
				</div>
				<div class="stats-content">
					<profile-match-stats-class-info
						class="class-info"
						*ngFor="let classInfo of classInfos$ | async"
						[classInfo]="classInfo"
						[currentMode]="value.currentMode"
					>
					</profile-match-stats-class-info>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileMatchStatsComponent extends AbstractSubscriptionStoreComponent implements AfterContentInit {
	modeOverviews$: Observable<readonly ModeOverview[]>;
	currentMode$: Observable<'constructed' | 'duels' | 'arena' | 'battlegrounds'>;
	classInfos$: Observable<readonly ClassInfo[]>;

	private currentMode$$ = new BehaviorSubject<'constructed' | 'duels' | 'arena' | 'battlegrounds'>('constructed');

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly allCards: CardsFacadeService,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.currentMode$ = this.currentMode$$.asObservable();
		this.classInfos$ = combineLatest([
			this.store.profileClassesProgress$(),
			this.store.profileBgHeroStat$(),
			this.store.profileDuelsHeroStats$(),
			this.currentMode$,
		]).pipe(
			this.mapData(([classProgress, bgHeroStat, duelsHeroStats, currentMode]) => {
				console.debug('building class infos', classProgress, currentMode);
				const hsClassProgress: readonly ClassInfo[] =
					currentMode === 'constructed' || currentMode === 'arena'
						? classProgress.map((info) => {
								const lowerCaseClass = CardClass[info.playerClass]?.toLowerCase();
								const gamesForMode = info.winsForModes.find((info) => info.mode === currentMode) ?? {
									wins: 0,
									losses: 0,
									ties: 0,
								};
								const classInfo: ClassInfo = {
									playerClass: CardClass[info.playerClass],
									icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${lowerCaseClass}.png`,
									name: this.i18n.translateString(`global.class.${lowerCaseClass}`),
									totalMatches: gamesForMode.losses + gamesForMode.wins + gamesForMode.ties,
									wins: gamesForMode.wins,
									losses: gamesForMode.losses,
									winrate:
										gamesForMode.wins + gamesForMode.losses === 0
											? null
											: (100 * gamesForMode.wins) / (gamesForMode.wins + gamesForMode.losses),
								};
								return classInfo;
						  })
						: [];
				const bgClassProgress: readonly ClassInfo[] =
					currentMode === 'battlegrounds'
						? bgHeroStat.map((info) => {
								const classInfo: ClassInfo = {
									playerClass: info.heroCardId,
									icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.heroCardId}.jpg`,
									name: this.allCards.getCard(info.heroCardId).name,
									top1: info.top1,
									top4: info.top4,
									totalMatches: info.gamesPlayed,
									winrate:
										info.gamesPlayed === 0
											? null
											: (100 * (info.top1 + info.top4)) / info.gamesPlayed,
								};
								return classInfo;
						  })
						: [];
				const duelsClassProgress: readonly ClassInfo[] =
					currentMode === 'duels'
						? duelsHeroStats.map((info) => {
								const classInfo: ClassInfo = {
									playerClass: info.heroCardId,
									icon: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${info.heroCardId}.jpg`,
									name: this.allCards.getCard(info.heroCardId).name,
									totalMatches: info.wins + info.losses,
									wins: info.wins,
									losses: info.losses,
									winrate:
										info.wins + info.losses === 0
											? null
											: (100 * info.wins) / (info.wins + info.losses),
								};
								return classInfo;
						  })
						: [];
				return [...hsClassProgress, ...bgClassProgress, ...duelsClassProgress];
			}),
		);

		this.modeOverviews$ = combineLatest([
			this.store.profileClassesProgress$(),
			this.store.profileBgHeroStat$(),
			this.store.profileDuelsHeroStats$(),
		]).pipe(
			this.mapData(([classProgress, bgHeroStat, duelsHeroStats]) => {
				const modes = ['constructed', 'arena'] as const;
				const hsModes = modes.map((mode) => {
					console.debug('getting wins for mode', mode, classProgress);
					const wins = classProgress
						.map((info) => info.winsForModes.find((info) => info.mode === mode)?.wins ?? 0)
						.reduce((a, b) => a + b, 0);
					const losses = classProgress
						.map((info) => info.winsForModes.find((info) => info.mode === mode)?.losses ?? 0)
						.reduce((a, b) => a + b, 0);
					// const ties = classProgress
					// 	.map((info) => info.winsForModes.find((info) => info.mode === mode).ties)
					// 	.reduce((a, b) => a + b, 0);
					const result: ModeOverview = {
						mode: mode,
						title: this.i18n.translateString(`global.game-mode.${mode}`),
						icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/${mode}.webp?v=2`,
						wins: wins,
						losses: losses,
						winrate: wins + losses === 0 ? null : (100 * wins) / (wins + losses),
					};
					return result;
				});

				const top1 = bgHeroStat.map((info) => info.top1).reduce((a, b) => a + b, 0);
				const top4 = bgHeroStat.map((info) => info.top4).reduce((a, b) => a + b, 0);
				const gamesPlayed = bgHeroStat.map((info) => info.gamesPlayed).reduce((a, b) => a + b, 0);
				const bgMode: ModeOverview = {
					mode: 'battlegrounds',
					title: this.i18n.translateString(`global.game-mode.battlegrounds`),
					icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/battlegrounds.webp?v=2`,
					top1: top1,
					top4: top4,
					gamesPlayed: gamesPlayed,
					winrate: gamesPlayed === 0 ? null : (100 * (top1 + top4)) / gamesPlayed,
				};

				const duelsWins = duelsHeroStats.map((info) => info.wins).reduce((a, b) => a + b, 0);
				const duelsLosses = duelsHeroStats.map((info) => info.losses).reduce((a, b) => a + b, 0);
				const duelsMode: ModeOverview = {
					mode: 'duels',
					title: this.i18n.translateString(`global.game-mode.duels`),
					icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/mode/duels.webp?v=2`,
					wins: duelsWins,
					losses: duelsLosses,
					winrate: duelsWins + duelsLosses === 0 ? null : (100 * duelsWins) / (duelsWins + duelsLosses),
				};
				return [...hsModes, bgMode, duelsMode];
			}),
		);
	}

	selectMode(mode: 'constructed' | 'duels' | 'arena' | 'battlegrounds') {
		this.currentMode$$.next(mode);
	}
}
