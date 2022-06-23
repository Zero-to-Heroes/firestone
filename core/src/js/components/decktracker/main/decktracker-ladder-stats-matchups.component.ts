import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { classes, formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../../services/ui-store/app-ui-store-facade.service';
import { groupByFunction } from '../../../services/utils';
import { AbstractSubscriptionComponent } from '../../abstract-subscription.component';

@Component({
	selector: 'decktracker-ladder-stats-matchups',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-ladder-stats-matchups.component.scss`,
	],
	template: `
		<div class="matchups">
			<div class="options"></div>
			<div class="matrix">
				<div class="row header">
					<div class="cell label"></div>
					<div class="cell opponent-class" *ngFor="let oppClass of allClasses">
						<img class="icon" [src]="oppClass.icon" [helpTooltip]="oppClass.tooltip" />
					</div>
					<div class="cell total" [owTranslate]="'app.decktracker.ladder-stats.total'"></div>
				</div>
				<div class="row" *ngFor="let row of rows$ | async">
					<div class="cell label">
						<img class="icon" [src]="row.icon" [helpTooltip]="row.tooltip" *ngIf="row.icon" />
						<div class="text" *ngIf="!row.icon" [owTranslate]="'app.decktracker.ladder-stats.total'"></div>
					</div>
					<div
						class="cell winrate number"
						*ngFor="let matchup of row.matchups"
						[ngClass]="{ 'empty': matchup.wins === 0 && matchup.losses === 0 }"
					>
						<span class="wins" *ngIf="matchup.wins > 0 || matchup.losses > 0">{{ matchup.wins }}</span>
						<span class="separator">-</span>
						<span class="losses" *ngIf="matchup.wins > 0 || matchup.losses > 0">{{ matchup.losses }}</span>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerLadderStatsMatchupsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;
	rows$: Observable<readonly MatchupRow[]>;

	allClasses: readonly { tooltip: string; icon: string }[];

	constructor(
		private readonly i18n: LocalizationFacadeService,
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		this.allClasses = classes.map((oppClass) => ({
			tooltip: this.i18n.translateString('app.decktracker.ladder-stats.opponent-class-tooltip', {
				className: formatClass(oppClass, this.i18n),
			}),
			icon: `assets/images/deck/classes/${oppClass}.png`,
		}));
		this.replays$ = combineLatest(
			this.store.listen$(([main, nav, prefs]) => main.decktracker.decks),
			this.store.listenPrefs$((prefs) => prefs.replaysActiveDeckstringsFilter),
		).pipe(
			this.mapData(([[decks], [deckstringsFilter]]) =>
				decks
					.filter((deck) => !deckstringsFilter?.length || deckstringsFilter.includes(deck.deckstring))
					.flatMap((deck) => deck.replays)
					.filter((replay) => !!replay.playerClass && !!replay.opponentClass),
			),
		);

		this.rows$ = combineLatest(this.replays$).pipe(
			this.mapData(([replays]) => {
				const groupedByPlayerClass = groupByFunction((replay: GameStat) => replay.playerClass)(replays);
				return [...classes, 'total'].map((playerClass) => {
					const replaysForPlayerClass =
						playerClass === 'total' ? replays : groupedByPlayerClass[playerClass] ?? [];
					return this.buildMatchupStatsForPlayerClass(playerClass, replaysForPlayerClass);
				});
			}),
		);
	}

	private buildMatchupStatsForPlayerClass(
		playerClass: string,
		replaysForPlayerClass: readonly GameStat[],
	): MatchupRow {
		const matchups: readonly Matchup[] = [...classes, 'total'].map((opponentClass) =>
			this.buildMatchup(playerClass, opponentClass, replaysForPlayerClass),
		);
		return {
			tooltip: this.i18n.translateString('app.decktracker.ladder-stats.player-class-tooltip', {
				className: formatClass(playerClass, this.i18n),
			}),
			icon: playerClass === 'total' ? null : `assets/images/deck/classes/${playerClass}.png`,
			matchups: matchups,
		};
	}

	private buildMatchup(
		playerClass: string,
		opponentClass: string,
		replaysForPlayerClass: readonly GameStat[],
	): Matchup {
		const replays = replaysForPlayerClass
			.filter((stat) => (playerClass === 'total' ? true : stat.playerClass === playerClass))
			.filter((stat) => (opponentClass === 'total' ? true : stat.opponentClass === opponentClass));
		return {
			playerClass: playerClass,
			opponentClass: opponentClass,
			wins: replays.filter((stat) => stat.result === 'won').length,
			losses: replays.filter((stat) => stat.result === 'lost').length,
			ties: replays.filter((stat) => stat.result === 'tied').length,
		};
	}
}

interface MatchupRow {
	readonly icon: string;
	readonly tooltip: string;
	readonly matchups: readonly Matchup[];
}

interface Matchup {
	readonly playerClass: string;
	readonly opponentClass: string;
	readonly wins: number;
	readonly losses: number;
	readonly ties: number;
}
