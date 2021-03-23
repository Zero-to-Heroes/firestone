import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { BoosterType } from '@firestone-hs/reference-data';
import { PackResult } from '@firestone-hs/retrieve-pack-stats';
import { PackInfo } from '../../models/collection/pack-info';
import { BinderState } from '../../models/mainwindow/binder-state';
import { NavigationCollection } from '../../models/mainwindow/navigation/navigation-collection';
import { boosterIdToBoosterName } from '../../services/hs-utils';
import { MainWindowStoreEvent } from '../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

@Component({
	selector: 'pack-stats',
	styleUrls: [`../../../css/global/scrollbar.scss`, `../../../css/component/collection/pack-stats.component.scss`],
	template: `
		<div class="pack-stats">
			<div class="header">All-time packs</div>
			<div class="packs-container">
				<div class="pack-stat" *ngFor="let pack of _packs" [ngClass]="{ 'missing': !pack.totalObtained }">
					<div
						class="icon-container"
						[style.width.px]="cardWidth"
						[style.height.px]="cardHeight"
						[helpTooltip]="
							'You received ' +
							pack.totalObtained +
							' ' +
							pack.name +
							' packs since you started playing Hearthstone'
						"
					>
						<img
							class="icon"
							[src]="
								'https://static.zerotoheroes.com/hearthstone/cardPacks/' + pack.packType + '.webp?v=2'
							"
						/>
					</div>
					<div class="value">{{ pack.totalObtained }}</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPackStatsComponent implements AfterViewInit {
	readonly DEFAULT_CARD_WIDTH = 115;
	readonly DEFAULT_CARD_HEIGHT = 155;

	cardWidth = this.DEFAULT_CARD_WIDTH;
	cardHeight = this.DEFAULT_CARD_HEIGHT;

	cardsOwnedActiveFilter: 'own' | 'dontown' | 'all';

	@Input() set state(value: BinderState) {
		if (value.packs === this._packs && value.packStats === this._packStats) {
			return;
		}
		this._packs = Object.values(BoosterType)
			.map((boosterId: BoosterType) => {
				console.debug('considering', boosterId, isNaN(boosterId));
				if (isNaN(boosterId)) {
					return null;
				}
				if ([BoosterType.INVALID, BoosterType.KOBOLDS_CATACOMBS].includes(boosterId)) {
					return null;
				}
				const pack = (value?.packs ?? []).find(p => p.packType === boosterId);
				console.debug('finding pack for', boosterId, pack);
				return {
					packType: boosterId,
					totalObtained: pack?.totalObtained ?? 0,
					unopened: 0,
					name: boosterIdToBoosterName(boosterId),
				};
			})
			.filter(info => info);
		this._packStats = value?.packStats ?? [];
		this.updateInfo();
	}

	@Input() set navigation(value: NavigationCollection) {
		this._navigation = value;
		this.updateInfo();
	}

	_packs: readonly InternalPackInfo[] = [];
	_packStats: readonly PackResult[];
	_navigation: NavigationCollection;

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	async ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}

	private updateInfo() {}
}

interface InternalPackInfo extends PackInfo {
	readonly name: string;
}
