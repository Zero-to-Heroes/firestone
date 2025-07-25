import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { Preferences, PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { GameStat } from '@firestone/stats/data-access';
import { Observable, combineLatest } from 'rxjs';
import { DecksProviderService } from '../../../services/decktracker/main/decks-provider.service';
import { classes, formatClass } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { groupByFunction } from '../../../services/utils';

@Component({
	standalone: false,
	selector: 'decktracker-ladder-stats-matchups',
	styleUrls: [
		`../../../../css/global/menu.scss`,
		`../../../../css/component/decktracker/main/decktracker-ladder-stats-matchups.component.scss`,
	],
	template: `
		<div class="matchups" *ngIf="{ showPercentages: showPercentages$ | async } as value">
			<div class="options">
				<preference-toggle
					class="percentage-toggle"
					field="desktopDeckShowMatchupAsPercentages"
					[label]="'app.decktracker.matchup-info.show-as-percent-button-label' | owTranslate"
				></preference-toggle>
				<preference-toggle
					class="going-first-toggle"
					field="desktopStatsShowGoingFirstOnly"
					[label]="'app.decktracker.ladder-stats.going-first-button-label' | owTranslate"
					[toggleFunction]="toggleShowFirst"
				></preference-toggle>
				<preference-toggle
					class="going-first-toggle"
					field="desktopStatsShowGoingSecondOnly"
					[label]="'app.decktracker.ladder-stats.going-second-button-label' | owTranslate"
					[toggleFunction]="toggleShowSecond"
				></preference-toggle>
			</div>
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
					<ng-container *ngFor="let matchup of row.matchups">
						<div
							class="cell winrate number"
							[ngClass]="{ empty: matchup.wins === 0 && matchup.losses === 0 }"
							*ngIf="!value.showPercentages"
						>
							<span class="wins" *ngIf="matchup.wins > 0 || matchup.losses > 0">{{ matchup.wins }}</span>
							<span class="separator">-</span>
							<span class="losses" *ngIf="matchup.wins > 0 || matchup.losses > 0">{{
								matchup.losses
							}}</span>
						</div>
						<div
							class="cell winrate"
							[ngClass]="{
								empty: matchup.wins === 0 && matchup.losses === 0,
								positive: matchup.wins > 0 && matchup.winrate > 51,
								negative: matchup.losses > 0 && matchup.winrate < 49
							}"
							*ngIf="value.showPercentages"
						>
							{{ buildValue(matchup.winrate) }}
						</div>
					</ng-container>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DecktrackerLadderStatsMatchupsComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	replays$: Observable<readonly GameStat[]>;
	rows$: Observable<readonly MatchupRow[]>;
	showPercentages$: Observable<boolean>;
	showFirstOnly$: Observable<boolean>;
	showSecondOnly$: Observable<boolean>;

	allClasses: readonly { tooltip: string; icon: string }[];

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly prefs: PreferencesService,
		private readonly decks: DecksProviderService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs, this.decks);

		this.allClasses = classes.map((oppClass) => ({
			tooltip: this.i18n.translateString('app.decktracker.ladder-stats.opponent-class-tooltip', {
				className: formatClass(oppClass, this.i18n),
			}),
			icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${oppClass}.png`,
		}));

		this.showPercentages$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.desktopDeckShowMatchupAsPercentages),
		);
		this.showFirstOnly$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.desktopStatsShowGoingFirstOnly),
		);
		this.showSecondOnly$ = this.prefs.preferences$$.pipe(
			this.mapData((prefs) => prefs.desktopStatsShowGoingSecondOnly),
		);

		// TODO: the standard/wild filter doesn't work, as it gives more result in Standard than in All...
		this.replays$ = combineLatest([
			this.decks.decks$$,
			this.prefs.preferences$$.pipe(this.mapData((prefs) => prefs.replaysActiveDeckstringsFilter)),
		]).pipe(
			this.mapData(([decks, deckstringsFilter]) => {
				const result = (decks ?? [])
					.filter(
						(deck) =>
							!deckstringsFilter?.length ||
							deckstringsFilter.includes(deck.deckstring) ||
							(deck.allVersions?.map((v) => v.deckstring) ?? []).some((d) =>
								deckstringsFilter.includes(d),
							),
					)
					.flatMap((deck) => deck.replays)
					.filter((replay) => !!replay.playerClass && !!replay.opponentClass);
				return result;
			}),
		);
		this.rows$ = combineLatest([this.replays$, this.showFirstOnly$, this.showSecondOnly$]).pipe(
			this.mapData(([replays, showFirst, showSecond]) => {
				const groupedByPlayerClass = groupByFunction((replay: GameStat) => replay.playerClass)(replays);
				return [...classes, 'total'].map((playerClass) => {
					const replaysForPlayerClass =
						playerClass === 'total' ? replays : groupedByPlayerClass[playerClass] ?? [];
					return this.buildMatchupStatsForPlayerClass(
						playerClass,
						replaysForPlayerClass,
						showFirst,
						showSecond,
					);
				});
			}),
		);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	toggleShowFirst = async (newValue: boolean) => {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			desktopStatsShowGoingFirstOnly: newValue,
			desktopStatsShowGoingSecondOnly: newValue ? undefined : prefs.desktopStatsShowGoingSecondOnly,
		};
		await this.prefs.savePreferences(newPrefs);
	};

	toggleShowSecond = async (newValue: boolean) => {
		const prefs = await this.prefs.getPreferences();
		const newPrefs: Preferences = {
			...prefs,
			desktopStatsShowGoingFirstOnly: newValue ? undefined : prefs.desktopStatsShowGoingFirstOnly,
			desktopStatsShowGoingSecondOnly: newValue,
		};
		await this.prefs.savePreferences(newPrefs);
	};

	buildValue(value: number): string {
		return value == null ? '-' : value.toFixed(0) + '%';
	}

	private buildMatchupStatsForPlayerClass(
		playerClass: string,
		replaysForPlayerClass: readonly GameStat[],
		showFirst: boolean,
		showSecond: boolean,
	): MatchupRow {
		const matchups: readonly Matchup[] = [...classes, 'total'].map((opponentClass) =>
			this.buildMatchup(playerClass, opponentClass, replaysForPlayerClass, showFirst, showSecond),
		);
		return {
			tooltip: this.i18n.translateString('app.decktracker.ladder-stats.player-class-tooltip', {
				className: formatClass(playerClass, this.i18n),
			}),
			icon:
				playerClass === 'total'
					? null
					: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass}.png`,
			matchups: matchups,
		};
	}

	private buildMatchup(
		playerClass: string,
		opponentClass: string,
		replaysForPlayerClass: readonly GameStat[],
		showFirst: boolean,
		showSecond: boolean,
	): Matchup {
		const replays = replaysForPlayerClass
			.filter((stat) => (playerClass === 'total' ? true : stat.playerClass === playerClass))
			.filter((stat) => (opponentClass === 'total' ? true : stat.opponentClass === opponentClass))
			.filter((stat) => (showFirst ? stat.coinPlay === 'play' : showSecond ? stat.coinPlay === 'coin' : true));
		const wins = replays.filter((stat) => stat.result === 'won').length;
		const losses = replays.filter((stat) => stat.result === 'lost').length;
		return {
			playerClass: playerClass,
			opponentClass: opponentClass,
			wins: wins,
			losses: losses,
			ties: replays.filter((stat) => stat.result === 'tied').length,
			winrate: wins + losses === 0 ? null : 100 * (wins / (wins + losses)),
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
	readonly winrate: number;
}
