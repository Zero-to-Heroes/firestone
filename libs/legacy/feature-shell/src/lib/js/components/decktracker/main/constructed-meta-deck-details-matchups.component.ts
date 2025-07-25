import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { ConstructedMatchupInfo } from '@firestone-hs/constructed-deck-stats';
import { buildPercents } from '@firestone/shared/framework/common';
import { CardsFacadeService } from '@firestone/shared/framework/core';
import { classes } from '../../../services/hs-utils';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	standalone: false,
	selector: 'constructed-meta-deck-details-matchups',
	styleUrls: [`../../../../css/component/decktracker/main/constructed-meta-deck-details-matchups.component.scss`],
	template: `
		<div class="constructed-meta-deck-details-matchups">
			<div class="header">
				<div class="name"></div>
				<div class="cell opponent-class" *ngFor="let opponent of opponents" [helpTooltip]="opponent.name">
					<img [src]="opponent.icon" class="icon" />
				</div>
			</div>
			<div class="content">
				<div class="matchup-row" *ngFor="let matchup of matchups">
					<div class="name">{{ matchup.name }}</div>
					<div
						class="cell opponent {{ opponent.winrateCss }}"
						*ngFor="let opponent of matchup.opponents"
						[helpTooltip]="opponent.tooltip"
					>
						{{ opponent.winrate }}
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMetaDeckDetailsMatchupsComponent {
	opponents: readonly OpponentInfo[] = [];
	matchups: readonly InternalMatchupDetails[];

	@Input() set matchupDetails(value: readonly ConstructedMatchupDetails[]) {
		this.opponents = classes
			.map((playerClass) => ({
				className: playerClass,
				name: this.i18n.translateString(`global.class.${playerClass}`),
				icon: `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/classes/${playerClass}.png`,
			}))
			.sort((a, b) => a.className.localeCompare(b.className));
		this.matchups = this.buildMatchups(value);
	}

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	private buildMatchups(matchups: readonly ConstructedMatchupDetails[]): readonly InternalMatchupDetails[] {
		return matchups.map((matchup) => this.buildMatchup(matchup));
	}

	private buildMatchup(matchup: ConstructedMatchupDetails): InternalMatchupDetails {
		const result: InternalMatchupDetails = {
			...matchup,
			opponents: classes
				.map((opponentClass) =>
					this.buildMatchupInfo(
						matchup.matchups.find((m) => m.opponentClass === opponentClass),
						opponentClass,
					),
				)
				.sort((a, b) => a.opponentClass.localeCompare(b.opponentClass)),
		};
		return result;
	}

	private buildMatchupInfo(matchup: ConstructedMatchupInfo, opponentClass: string): InternalMatchupInfo {
		const winrate = !matchup?.totalGames ? null : matchup.wins / matchup.totalGames;
		const result: InternalMatchupInfo = {
			opponentClass: opponentClass,
			winrate: winrate == null ? '-' : buildPercents(winrate),
			winrateCss: winrate == null ? '' : winrate > 0.5 ? 'positive' : 'negative',
			tooltip: this.i18n.translateString(`app.decktracker.meta.matchup-vs-tooltip`, {
				className: this.i18n.translateString(`global.class.${opponentClass}`),
			}),
		};
		return result;
	}
}

export interface ConstructedMatchupDetails {
	readonly name: string;
	readonly matchups: readonly ConstructedMatchupInfo[];
}

interface InternalMatchupDetails {
	readonly name: string;
	readonly opponents: readonly InternalMatchupInfo[];
}

interface InternalMatchupInfo {
	readonly opponentClass: string;
	readonly winrate: string;
	readonly winrateCss: string;
	readonly tooltip: string;
}

interface OpponentInfo {
	readonly name: string;
	readonly icon: string;
}
