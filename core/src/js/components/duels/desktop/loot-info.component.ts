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

@Component({
	selector: 'loot-info',
	styleUrls: [`../../../../css/global/menu.scss`, `../../../../css/component/duels/desktop/loot-info.component.scss`],
	template: `
		<div class="loot-info">
			<div class="treasure-loot" *ngIf="bundleType === 'treasure'">
				<div class="text">Treasures!</div>
				<div class="option" *ngFor="let option of options" [cardTooltip]="option.cardId">
					<img class="option-image" [src]="option.optionImage" [ngClass]="{ 'picked': option.isPicked }" />
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
			},
			{
				cardId: value.option2,
				isPicked: value.chosenOptionIndex === 2,
				optionImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.option2}.jpg`,
			},
			{
				cardId: value.option3,
				isPicked: value.chosenOptionIndex === 3,
				optionImage: `https://static.zerotoheroes.com/hearthstone/cardart/256x/${value.option3}.jpg`,
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

interface Option {
	cardId: string;
	optionImage: string;
	isPicked: boolean;
}
