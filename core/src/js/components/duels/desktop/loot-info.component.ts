import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { BundleType, DuelsRunInfo } from '@firestone-hs/retrieve-users-duels-runs/dist/duels-run-info';
import { MainWindowStoreEvent } from '../../../services/mainwindow/store/events/main-window-store-event';
import { OverwolfService } from '../../../services/overwolf.service';
import { Option } from './option';

@Component({
	selector: 'loot-info',
	styleUrls: [`../../../../css/global/menu.scss`, `../../../../css/component/duels/desktop/loot-info.component.scss`],
	template: `
		<div class="loot-info {{ bundleType }}">
			<div class="treasure-loot" *ngIf="bundleType === 'treasure'">
				<div class="text">Treasures</div>
				<div class="options">
					<div
						class="option"
						*ngFor="let option of options"
						[cardTooltip]="option.cardId"
						[ngClass]="{ 'picked': option.isPicked }"
					>
						<img class="option-image" [src]="option.optionImage" />
					</div>
				</div>
			</div>
			<div class="loot" *ngIf="bundleType === 'loot'">
				<div class="text">Loot</div>
				<div class="bundles">
					<loot-bundle
						class="option"
						*ngFor="let option of options; let i = index"
						[option]="option"
						[ngClass]="{ 'picked': option.isPicked }"
					>
					</loot-bundle>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LootInfoComponent implements AfterViewInit {
	@Input() set loot(value: DuelsRunInfo) {
		this.bundleType = value.bundleType;
		this.options = [
			{
				cardId: value.option1,
				isPicked: value.chosenOptionIndex === 1,
				optionImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.option1}.jpg`,
				contents: value.option1Contents || [],
			},
			{
				cardId: value.option2,
				isPicked: value.chosenOptionIndex === 2,
				optionImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.option2}.jpg`,
				contents: value.option2Contents || [],
			},
			{
				cardId: value.option3,
				isPicked: value.chosenOptionIndex === 3,
				optionImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.option3}.jpg`,
				contents: value.option3Contents || [],
			},
		];
	}

	bundleType: BundleType;
	options: readonly Option[];

	private stateUpdater: EventEmitter<MainWindowStoreEvent>;

	constructor(
		private readonly ow: OverwolfService,
		private readonly allCards: AllCardsService,
		private readonly cdr: ChangeDetectorRef,
	) {}

	ngAfterViewInit() {
		this.stateUpdater = this.ow.getMainWindow().mainWindowStoreUpdater;
	}
}
