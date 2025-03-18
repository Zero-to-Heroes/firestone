/* eslint-disable no-mixed-spaces-and-tabs */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DraftDeckStats } from '@firestone-hs/arena-draft-pick';
import { getDefaultHeroDbfIdForClass } from '@firestone-hs/reference-data';
import { CardsFacadeService, ILocalizationService, formatClass } from '@firestone/shared/framework/core';
import { ExtendedArenaRunInfo, InternalNotableCard } from '../../models/arena-high-wins-runs';
import { ArenaRun } from '../../models/arena-run';
import { buildNotableCards } from '../../services/arena-high-wins-runs.service';
import { ArenaNavigationService } from '../../services/arena-navigation.service';

@Component({
	selector: 'arena-run-vignette',
	styleUrls: [`./arena-run-vignette.component.scss`],
	template: `
		<div class="arena-run">
			<div class="left-info">
				<div class="group mode">
					<img class="game-mode" [src]="gameModeImage" [helpTooltip]="gameModeTooltip" />
				</div>

				<div class="group result" *ngIf="wins !== null">
					<div class="wins">{{ wins }}</div>
					<div class="separator">-</div>
					<div class="losses">{{ losses }}</div>
				</div>

				<div class="group player-images">
					<img
						class="player-class"
						[src]="playerClassImage"
						[cardTooltip]="playerCardId"
						*ngIf="playerClassImage"
					/>
				</div>

				<div class="group notable-cards" *ngIf="notableCards?.length">
					<img
						*ngFor="let card of notableCards"
						class="notable-card"
						[src]="card.image"
						[cardTooltip]="card.cardId"
					/>
				</div>

				<div class="group score" *ngIf="!!deckScore" [helpTooltip]="deckScoreTooltip">
					<div class="image" [inlineSVG]="'assets/svg/star.svg'"></div>
					<div class="value">{{ deckScore }}</div>
				</div>
			</div>
			<div class="right-info">
				<div class="group view-deck" (click)="showDeck()" *ngIf="deckstring">
					<div class="text" [fsTranslate]="'app.duels.run.view-deck-button'"></div>
					<div class="icon" inlineSVG="assets/svg/view_deck.svg"></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaRunVignetteComponent {
	@Input() set stat(value: ExtendedArenaRunInfo) {
		// console.debug('setting stat', value);
		this.setStat(value);
	}

	deckstring: string;
	gameModeImage: string;
	gameModeTooltip: string | null;
	playerCardId: string;
	playerClassImage: string | null;
	playerClassTooltip: string | null;
	wins: number;
	losses: number;
	deckImpact: string | null;
	deckScore: string | null;
	deckScoreTooltip: string | null;
	notableCards: readonly InternalNotableCard[];

	private _run: ArenaRun;

	constructor(
		private readonly i18n: ILocalizationService,
		private readonly allCards: CardsFacadeService,
		private readonly nav: ArenaNavigationService,
	) {}

	async showDeck() {
		await this.nav.isReady();

		this.nav.selectedCategoryId$$.next('arena-deck-details');
		this.nav.setHighWinsRunId(+this._run?.id);
	}

	private setStat(value: ExtendedArenaRunInfo) {
		this.deckstring = value.decklist;
		// this.steps = this._run.steps;

		this.wins = value.wins;
		this.losses = value.losses;
		this.gameModeTooltip = this.i18n.translateString('app.arena.runs.run-name', { value: this.wins });
		this.gameModeImage = `https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/arena/arena${this.wins}wins.png`;

		const heroCard = this.allCards.getCard(getDefaultHeroDbfIdForClass(value.playerClass));
		this.playerClassImage = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${heroCard.id}.jpg`;
		this.playerCardId = heroCard.id;
		this.playerClassTooltip = `${heroCard.name} (${formatClass(heroCard.classes?.[0] ?? 'invalid', this.i18n)})`;
		this.deckScore = value.deckScore != null ? value.deckScore.toFixed(1) : null;
		// this.deckImpact = value.deckImpact != null ? this._run.draftStat.deckImpact.toFixed(2) : null;
		this.deckScoreTooltip = this.i18n.translateString('app.arena.runs.deck-score-tooltip');
		this.notableCards = value.notabledCards ?? buildNotableCards(value.decklist, this.allCards);

		this._run = ArenaRun.create({
			id: '' + value.id,
			initialDeckList: value.decklist,
			steps: [],
			rewards: [],
			draftStat: {
				deckScore: value.deckScore,
			} as DraftDeckStats,
			creationTimestamp: new Date(value.creationDate).getTime(),
			heroCardId: heroCard.id,
			wins: value.wins,
			losses: value.losses,
		});
	}
}
