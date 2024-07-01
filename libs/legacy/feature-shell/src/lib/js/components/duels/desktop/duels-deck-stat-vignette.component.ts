import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { isPassive } from '@firestone-hs/reference-data';
import { CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { DuelsDeckStat } from '../../../models/duels/duels-player-stats';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';
import { DuelsViewDeckDetailsEvent } from '../../../services/mainwindow/store/events/duels/duels-view-deck-details-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';

@Component({
	selector: 'duels-deck-stat-vignette',
	styleUrls: [`../../../../css/component/duels/desktop/duels-deck-stat-vignette.component.scss`],
	template: `
		<div class="duels-deck-stat">
			<div class="mode-color-code {{ gameMode }}"></div>

			<div class="left-info">
				<div class="group mode">
					<img class="game-mode" [src]="gameModeImage" [helpTooltip]="gameModeTooltip" />
					<div class="rank-text" *ngIf="rankText">{{ rankText }}</div>
				</div>

				<div class="group result" *ngIf="wins != null">
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
					<!-- <div class="separator" *ngIf="heroPowerImage">-</div> -->
					<img
						class="hero-power"
						[src]="heroPowerImage"
						[cardTooltip]="heroPowerCardId"
						*ngIf="heroPowerImage"
					/>
					<!-- <div class="separator" *ngIf="signatureTreasureImage">-</div> -->
					<img
						class="signature-treasure"
						[src]="signatureTreasureImage"
						[cardTooltip]="signatureTreasureCardId"
						*ngIf="signatureTreasureImage"
					/>
				</div>

				<div class="group passives">
					<img
						*ngFor="let passive of passives"
						class="passive"
						[src]="passive.image"
						[cardTooltip]="passive.cardId"
					/>
				</div>

				<div class="dust-cost">
					<svg class="dust-icon svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#dust" />
					</svg>
					<div
						class="value"
						*ngIf="dustCost"
						[helpTooltip]="'app.duels.deck-stat.dust-missing-tooltip' | owTranslate"
					>
						{{ dustCost }}
					</div>
					<div
						class="value"
						*ngIf="dustCost === 0"
						[helpTooltip]="'app.duels.deck-stat.no-dust-missing-tooltip' | owTranslate"
					>
						0
					</div>
				</div>
			</div>
			<div class="right-info">
				<div class="group view-deck" (click)="viewDetails()" *ngIf="deckstring">
					<div class="text" [owTranslate]="'app.duels.deck-stat.view-details-button'"></div>
					<div class="icon" inlineSVG="assets/svg/collapse_caret.svg"></div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckStatVignetteComponent implements AfterViewInit {
	@Input() set stat(value: DuelsDeckStat) {
		if (!value || value === this._stat) {
			return;
		}
		this._stat = value;

		this.gameMode = this._stat.gameMode;
		this.gameModeImage =
			this._stat.gameMode === 'duels'
				? 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/casual_duels.png'
				: 'https://static.zerotoheroes.com/hearthstone/asset/firestone/images/deck/ranks/heroic_duels.png';
		this.gameModeTooltip =
			this._stat.gameMode === 'duels'
				? this.i18n.translateString('global.game-mode.casual-duels')
				: this.i18n.translateString('global.game-mode.heroic-duels');
		this.rankText = `${value.rating}`;

		this.wins = this._stat.wins;
		this.losses = this._stat.losses;

		this.playerClassImage = this._stat.heroCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._stat.heroCardId}.jpg`
			: null;
		this.playerCardId = this._stat.heroCardId;
		const heroCard = this._stat.heroCardId ? this.allCards.getCard(this._stat.heroCardId) : null;
		this.playerClassTooltip = heroCard ? `${heroCard.name} (${heroCard.playerClass})` : null;

		this.heroPowerCardId = this._stat.heroPowerCardId;
		this.heroPowerImage = this._stat.heroPowerCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._stat.heroPowerCardId}.jpg`
			: null;
		const heroPowerCard = this._stat.heroPowerCardId ? this.allCards.getCard(this._stat.heroPowerCardId) : null;
		this.heroPowerTooltip = this._stat ? heroPowerCard.name : null;

		this.signatureTreasureCardId = this._stat.signatureTreasureCardId;
		this.signatureTreasureImage = this._stat.signatureTreasureCardId
			? `https://static.zerotoheroes.com/hearthstone/cardart/256x/${this._stat.signatureTreasureCardId}.jpg`
			: null;
		const signatureTreasureCard = this._stat.signatureTreasureCardId
			? this.allCards.getCard(this._stat.signatureTreasureCardId)
			: null;
		this.signatureTreasureTooltip = signatureTreasureCard ? signatureTreasureCard.name : null;

		this.deckstring = value.decklist;
		this.dustCost = value.dustCost;
		this.passives = this.buildPassives(value);
	}

	gameMode: 'duels' | 'paid-duels';
	gameModeImage: string;
	gameModeTooltip: string;
	rankText: string;

	wins: number;
	losses: number;

	playerCardId: string;
	playerClassImage: string;
	playerClassTooltip: string;

	heroPowerCardId: string;
	heroPowerImage: string;
	heroPowerTooltip: string;

	signatureTreasureCardId: string;
	signatureTreasureImage: string;
	signatureTreasureTooltip: string;

	deckstring: string;
	dustCost: number;

	passives: readonly InternalPassive[];

	private _stat: DuelsDeckStat;
	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: CardsFacadeService,
		private readonly i18n: LocalizationFacadeService,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	viewDetails() {
		this.stateUpdater.next(new DuelsViewDeckDetailsEvent(this._stat.id));
	}

	buildPassives(deck: DuelsDeckStat): readonly InternalPassive[] {
		return deck.treasuresCardIds
			.filter((cardId) => isPassive(cardId, this.allCards))
			.map((passiveCardId) => ({
				cardId: passiveCardId,
				image: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${passiveCardId}.jpg`,
			}));
	}
}

interface InternalPassive {
	image: string;
	cardId: string;
}
