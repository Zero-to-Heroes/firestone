import { AfterViewInit, ChangeDetectorRef, EventEmitter, Input, ViewRef } from '@angular/core';
import { CardsFacadeService } from '@services/cards-facade.service';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

// @Component({
// 	selector: 'duels-treasure-stat-vignette',
// 	styleUrls: [
// 		`../../../../css/component/duels/desktop/duels-treasure-stat-vignette.component.scss`,
// 	],
// 	template: `
// 		<div class="duels-treasure-stat-vignette">
// 			<div class="box-side">
// 				<div class="name-container">
// 					<div class="name" [helpTooltip]="name">{{ name }}</div>
// 					<div class="info" [helpTooltip]="numberOfGamesTooltip">
// 						<svg>
// 							<use xlink:href="assets/svg/sprite.svg#info" />
// 						</svg>
// 					</div>
// 				</div>
// 				<img [src]="icon" class="portrait" [cardTooltip]="cardId" />
// 				<div class="stats">
// 					<div class="stats">
// 						<div class="item winrate">
// 							<div class="label">Global winrate</div>
// 							<div class="values">
// 								<div class="value player">{{ buildPercents(globalWinrate) }}</div>
// 							</div>
// 						</div>
// 						<div class="item pickrate">
// 							<div class="label">Global pick rate</div>
// 							<div class="values">
// 								<div class="value player">{{ buildPercents(globalPickRate) }}</div>
// 							</div>
// 						</div>
// 						<div class="item pickrate">
// 							<div class="label">Global offering</div>
// 							<div class="values">
// 								<div class="value player">{{ buildPercents(globalOfferingRate) }}</div>
// 							</div>
// 						</div>
// 						<div class="item pickrate">
// 							<div class="label">Your pick rate</div>
// 							<div class="values">
// 								<div class="value player">{{ buildPercents(playerPickRate) }}</div>
// 							</div>
// 						</div>
// 					</div>
// 				</div>
// 			</div>
// 		</div>
// 	`,
// 	changeDetection: ChangeDetectionStrategy.OnPush,
// })
// Deprecated
export class DuelsTreasureStatVignetteComponent implements AfterViewInit {
	@Input() set stat(value: any) {
		if (!value || value === this._stat) {
			return;
		}
		this._stat = value;
		this.name = this.cards.getCard(value.cardId)?.name;
		this.cardId = value.cardId;
		this.playerClass = this.cards.getCard(value.cardId)?.playerClass;
		this.icon = `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.cardId}.jpg`;
		this.playerPickRate = value.playerPickRate;
		this.globalPickRate = value.globalPickRate;
		this.globalWinrate = value.globalWinrate;
		this.globalOfferingRate = value.globalOfferingRate;
		this.numberOfGamesTooltip = `${value.globalTotalMatches.toLocaleString()} matches recorded`;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	_stat: any;
	cardId: string;
	name: string;
	playerClass: string;
	icon: string;
	globalPickRate: number;
	globalWinrate: number;
	globalOfferingRate: number;
	playerPickRate: number;
	numberOfGamesTooltip: string;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly cards: CardsFacadeService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildPercents(value: number): string {
		return value == null || isNaN(value) ? '-' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? '-' : value === 0 ? '0' : value.toFixed(decimal);
	}
}
