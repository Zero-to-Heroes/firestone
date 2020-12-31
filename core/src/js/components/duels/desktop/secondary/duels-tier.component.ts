import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { MainWindowStoreEvent } from '../../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../../services/overwolf.service';
import { DuelsTier, DuelsTierItem } from './duels-tier';

@Component({
	selector: 'duels-tier',
	styleUrls: [
		`../../../../../css/global/components-global.scss`,
		`../../../../../css/component/duels/desktop/secondary/duels-tier.component.scss`,
	],
	template: `
		<div class="duels-tier">
			<div class="header {{ label?.toLowerCase() }}" [helpTooltip]="tooltip">
				{{ label }}
			</div>
			<div class="items">
				<img class="item" *ngFor="let item of items" [src]="item.icon" [cardTooltip]="item.cardId" />
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsTierComponent implements AfterViewInit {
	@Input() set tier(value: DuelsTier) {
		this.label = value.label;
		this.tooltip = value.tooltip;
		this.items = value.items;
	}

	label: string;
	tooltip: string;
	items: readonly DuelsTierItem[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(private readonly ow: OverwolfService, private readonly allCards: AllCardsService) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
