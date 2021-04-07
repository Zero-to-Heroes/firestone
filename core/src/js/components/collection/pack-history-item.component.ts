import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { PackResult } from '@firestone-hs/retrieve-pack-stats';
import { Events } from '../../services/events.service';
import { boosterIdToBoosterName, getDefaultBoosterIdForSetId, getPackDustValue } from '../../services/hs-utils';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude;

@Component({
	selector: 'pack-history-item',
	styleUrls: [`../../../css/component/collection/pack-history-item.component.scss`],
	template: `
		<div class="pack-history-item">
			<img class="set-icon" src="{{ setIcon }}" />
			<span class="name">{{ setName }}</span>
			<span class="dust-amount">
				<span>{{ dustValue }}</span>
				<i class="i-30 pale-theme">
					<svg class="svg-icon-fill">
						<use xlink:href="assets/svg/sprite.svg#dust" />
					</svg>
				</i>
			</span>
			<span class="date">{{ creationDate }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackHistoryItemComponent implements AfterViewInit {
	@Input('historyItem') set historyItem(pack: PackResult) {
		if (!pack) {
			return;
		}
		const boosterId = pack.boosterId ?? getDefaultBoosterIdForSetId(pack.setId);
		this.setIcon = `https://static.zerotoheroes.com/hearthstone/cardPacks/${boosterId}.webp`;
		this.setName = boosterIdToBoosterName(boosterId);
		this.dustValue = getPackDustValue(pack);
		this.creationDate = new Date(pack.creationDate).toLocaleDateString('en-GB', {
			day: '2-digit',
			month: '2-digit',
			year: '2-digit',
		});
	}

	setIcon: string;
	setName: string;
	creationDate: string;
	dustValue: number;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private events: Events,
		private cards: AllCardsService,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
