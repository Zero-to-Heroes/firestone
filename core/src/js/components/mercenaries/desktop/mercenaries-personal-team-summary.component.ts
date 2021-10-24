import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { GameStat } from '../../../models/mainwindow/stats/game-stat';
import { CardsFacadeService } from '../../../services/cards-facade.service';
import { getHeroRole, normalizeMercenariesCardId } from '../../../services/mercenaries/mercenaries-utils';
import { groupByFunction } from '../../../services/utils';
import { MercenaryPersonalTeamInfo } from './mercenary-info';

@Component({
	selector: 'mercenaries-personal-team-summary',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/controls/controls.scss`,
		`../../../../css/component/controls/control-close.component.scss`,
		`../../../../css/component/mercenaries/desktop/mercenaries-personal-team-summary.component.scss`,
	],
	template: `
		<div class="mercenaries-personal-team-summary">
			<div class="team-name" [helpTooltip]="teamNameTooltip">{{ teamName }}</div>
			<div class="team-image">
				<div class="heroes-container bench">
					<div class="portrait" *ngFor="let hero of benchHeroes" [cardTooltip]="hero.cardId">
						<img class="icon" [src]="hero.portraitUrl" />
						<img class="frame" [src]="hero.frameUrl" />
					</div>
				</div>
				<div class="heroes-container starter">
					<div class="portrait" *ngFor="let hero of starterHeroes" [cardTooltip]="hero.cardId">
						<img class="icon" [src]="hero.portraitUrl" />
						<img class="frame" [src]="hero.frameUrl" />
					</div>
				</div>
			</div>
			<div class="stats">
				<div class="text total-games">{{ totalGames }} games</div>
				<div class="text win-rate" *ngIf="winRatePercentage != null">{{ winRatePercentage }}% win rate</div>
				<div class="last-used">Last used: {{ lastUsed }}</div>
			</div>
			<button
				class="close-button"
				helpTooltip="Archive team (you can restore it later)"
				(mousedown)="hideTeam($event)"
				*ngIf="!hidden"
			>
				<svg class="svg-icon-fill">
					<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#bin"></use>
				</svg>
			</button>
			<button class="restore-button" helpTooltip="Restore team" (mousedown)="restoreTeam($event)" *ngIf="hidden">
				<svg class="svg-icon-fill">
					<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#restore"></use>
				</svg>
			</button>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesPersonalTeamSummaryComponent {
	@Input() set team(value: MercenaryPersonalTeamInfo) {
		const gamesForTeam = value.games;
		this.teamName = gamesForTeam.filter((stat) => !!stat.playerDeckName)[0]?.playerDeckName || 'Unnamed Team';
		this.teamNameTooltip = `${this.teamName}`;
		this.totalGames = gamesForTeam.length;
		const totalWins = gamesForTeam.filter((stat) => stat.result === 'won').length;
		this.winRatePercentage = !!gamesForTeam.length
			? parseFloat('' + (100 * totalWins) / gamesForTeam.length).toLocaleString('en-US', {
					minimumIntegerDigits: 1,
					maximumFractionDigits: 2,
			  })
			: null;
		const lastUsed = gamesForTeam.filter((stat) => stat.creationTimestamp)[0]?.creationTimestamp;
		this.lastUsed = lastUsed ? this.buildLastUsedDate(lastUsed) : 'N/A';

		const mostFrequentStarterTeam = this.getMostFrequentStarterTeam(gamesForTeam);
		const bench = value.mercenariesCardIds
			.map((cardId) => normalizeMercenariesCardId(cardId))
			.filter((cardId) => !mostFrequentStarterTeam.includes(cardId));
		// console.debug('starters', mostFrequentStarterTeam, 'bench', bench, value);
		this.starterHeroes = mostFrequentStarterTeam.map((cardId) => ({
			cardId: cardId,
			portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
			frameUrl: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${getHeroRole(
				this.allCards.getCard(cardId).mercenaryRole,
			)}.png?v=2`,
		}));
		this.benchHeroes = bench.map((cardId) => ({
			cardId: cardId,
			portraitUrl: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${cardId}.jpg`,
			frameUrl: `https://static.zerotoheroes.com/hearthstone/asset/firestone/mercenaries_hero_frame_golden_${getHeroRole(
				this.allCards.getCard(cardId).mercenaryRole,
			)}.png?v=2`,
		}));
	}

	starterHeroes: readonly Hero[];
	benchHeroes: readonly Hero[];
	teamName: string;
	teamNameTooltip: string;
	totalGames: number;
	winRatePercentage: string;
	lastUsed: string;
	hidden: boolean;

	constructor(private readonly allCards: CardsFacadeService) {}

	hideDeck(event: MouseEvent) {
		// this.stateUpdater.next(new HideDeckSummaryEvent(this._deck.deckstring));
		event.stopPropagation();
		event.preventDefault();
	}

	restoreDeck(event: MouseEvent) {
		// this.stateUpdater.next(new RestoreDeckSummaryEvent(this._deck.deckstring));
		event.stopPropagation();
		event.preventDefault();
	}

	private buildLastUsedDate(lastUsedTimestamp: number): string {
		const date = new Date(lastUsedTimestamp);
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: '2-digit',
			year: 'numeric',
		});
	}

	private getMostFrequentStarterTeam(gamesForTeam: readonly GameStat[]): readonly string[] {
		const groupedByStarter = groupByFunction((stat: GameStat) =>
			stat.mercHeroTimings
				.filter((timing) => timing.turnInPlay === 1)
				.map((timing) => normalizeMercenariesCardId(timing.cardId))
				.sort()
				.join(','),
		)(gamesForTeam);
		let result = [];
		let currentBiggest = 0;
		for (const starter of Object.keys(groupedByStarter)) {
			const numberOfGamesWithStarter = groupedByStarter[starter].length;
			if (numberOfGamesWithStarter > currentBiggest) {
				currentBiggest = numberOfGamesWithStarter;
				result = starter.split(',').map((cardId) => normalizeMercenariesCardId(cardId));
			}
		}
		return result;
	}
}

interface Hero {
	readonly cardId: string;
	readonly portraitUrl: string;
	readonly frameUrl: string;
}
