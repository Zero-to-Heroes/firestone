import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { DuelsTreasureStat } from '../../../models/duels/duels-player-stats';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';

@Component({
	selector: 'duels-treasure-stat-vignette',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/duels/desktop/duels-treasure-stat-vignette.component.scss`,
	],
	template: `
		<div class="duels-treasure-stat-vignette">
			<div class="box-side">
				<div class="name" [helpTooltip]="name">{{ name }}</div>
				<img [src]="icon" class="portrait" [cardTooltip]="cardId" />
				<div class="stats">
					<div class="stats">
						<div class="item winrate">
							<div class="label">Global winrate</div>
							<div class="values">
								<div class="value player">{{ buildPercents(globalWinrate) }}</div>
							</div>
						</div>
						<div class="item pickrate">
							<div class="label">Global pick rate</div>
							<div class="values">
								<div class="value player">{{ buildPercents(globalPickRate) }}</div>
							</div>
						</div>
						<!-- <div class="item pickrate">
							<div class="label">Global offering</div>
							<div class="values">
								<div class="value player">{{ buildPercents(globalOfferingRate) }}</div>
							</div>
						</div> -->
						<div class="item pickrate">
							<div class="label">Your pick rate</div>
							<div class="values">
								<div class="value player">{{ buildPercents(playerPickRate) }}</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTreasureStatVignetteComponent implements AfterViewInit {
	@Input() set stat(value: DuelsTreasureStat) {
		// TODO: stat per class
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
	}

	_stat: DuelsTreasureStat;
	cardId: string;
	name: string;
	playerClass: string;
	icon: string;
	globalPickRate: number;
	globalWinrate: number;
	globalOfferingRate: number;
	playerPickRate: number;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly cards: AllCardsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	buildPercents(value: number): string {
		return value == null ? 'N/A' : value.toFixed(1) + '%';
	}

	buildValue(value: number, decimal = 2): string {
		return value == null ? 'N/A' : value === 0 ? '0' : value.toFixed(decimal);
	}
}
