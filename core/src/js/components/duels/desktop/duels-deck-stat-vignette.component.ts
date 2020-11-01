import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsDeckStat } from '../../../models/duels/duels-player-stats';
import { DuelsViewDeckDetailsEvent } from '../../../services/mainwindow/store/events/duels/duels-view-deck-details-event';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { formatClass } from '../../../services/utils';

@Component({
	selector: 'duels-deck-stat-vignette',
	styleUrls: [
		`../../../../css/component/duels/desktop/duels-deck-stat-vignette.component.scss`,
		`../../../../css/global/components-global.scss`,
	],
	template: `
		<div class="duels-deck-stat-vignette">
			<div class="box-side">
				<div class="deck-name">{{ deckName }}</div>
				<div class="summary">
					<div class="deck-image">
						<img class="skin" [src]="skin" />
						<img class="frame" src="assets/images/deck/hero_frame.png" />
					</div>
					<div class="info">
						<div class="starting">
							<img class="icon hero-power" [src]="heroPowerImage" [cardTooltip]="heroPowerCardId" />
							<img
								class="icon signature-treasure"
								[src]="signatureTreasureImage"
								[cardTooltip]="signatureTreasureCardId"
							/>
						</div>
						<!-- <ul class="treasures">
						<img
							class="icon treasure"
							*ngFor="let treasure of treasures"
							[src]="treasure.icon"
							[cardTooltip]="treasure.cardId"
						/>
					</ul> -->
					</div>
				</div>
				<div class="dust-cost">
					<svg class="dust-icon svg-icon-fill" *ngIf="dustCost">
						<use xlink:href="assets/svg/sprite.svg#dust" />
					</svg>
					<div class="dust-cost" *ngIf="dustCost">{{ dustCost }}</div>
					<div class="dust-cost" *ngIf="dustCost === 0">You have all cards</div>
				</div>
				<button class="view-details" (click)="viewDetails()">
					<span>View details</span>
				</button>
				<!-- <button class="copy-deck-code" (click)="copyDeckCode()">
					<span>{{ copyText }}</span>
				</button> -->
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsDeckStatVignetteComponent implements AfterViewInit {
	@Input() set stat(value: DuelsDeckStat) {
		// console.log('setting stats', value);
		if (!value || value === this._stat) {
			return;
		}
		this._stat = value;
		const deckNamePrefix = value.wins ? `${value.wins}-${value.losses} ` : '';
		this.deckName = deckNamePrefix + formatClass(value.playerClass);
		this.deckstring = value.decklist;
		this.skin = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.heroCardId}.jpg`;
		this.heroPowerCardId = value.heroPowerCardId;
		this.heroPowerImage = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.heroPowerCardId}.jpg`;
		this.signatureTreasureCardId = value.signatureTreasureCardId;
		this.signatureTreasureImage = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.signatureTreasureCardId}.jpg`;

		this.dustCost = value.dustCost;
	}

	_stat: DuelsDeckStat;
	deckName: string;
	deckstring: string;
	skin: string;
	heroPowerCardId: string;
	heroPowerImage: string;
	signatureTreasureCardId: string;
	signatureTreasureImage: string;
	treasures: readonly { icon: string; cardId: string }[];
	dustCost: number;

	copyText = 'Copy deck code';

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	async copyDeckCode() {
		this.ow.placeOnClipboard(this.deckstring);
		const inputCopy = this.copyText;
		this.copyText = 'Copied!';
		console.log('copied deckstring to clipboard', this.deckstring);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
		setTimeout(() => {
			this.copyText = inputCopy;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 2000);
	}

	buildPercents(value: number): string {
		return value == null ? 'N/A' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? 'N/A' : value === 0 ? '0' : value.toFixed(decimal);
	}

	viewDetails() {
		this.stateUpdater.next(new DuelsViewDeckDetailsEvent(this._stat.id));
	}
}
