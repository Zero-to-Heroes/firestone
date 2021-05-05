import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
} from '@angular/core';
import { ConstructedState } from '../../models/constructed/constructed-state';
import { ConstructedTab } from '../../models/constructed/constructed-tab.type';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { ConstructedChangeTabEvent } from '../../services/decktracker/event/constructed-change-tab-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'menu-selection-constructed',
	styleUrls: [
		`../../../css/global/menu.scss`,
		`../../../css/component/constructed/constructed-menu-selection.component.scss`,
	],
	template: `
		<ul class="menu-selection">
			<li
				[ngClass]="{ 'selected': state?.currentTab === 'achievements' }"
				(mousedown)="selectStage('achievements')"
			>
				<span>Achievements</span>
			</li>
			<li [ngClass]="{ 'selected': state?.currentTab === 'opponent' }" (mousedown)="selectStage('opponent')">
				<span>Opponent</span>
			</li>
		</ul>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedMenuSelectionComponent implements AfterViewInit {
	@Input() state: ConstructedState;

	private updater: EventEmitter<GameStateEvent>;

	constructor(private ow: OverwolfService, private cdr: ChangeDetectorRef) {}

	async ngAfterViewInit() {
		this.updater = (await this.ow.getMainWindow()).deckUpdater;
	}

	selectStage(tab: ConstructedTab) {
		this.updater.next(new ConstructedChangeTabEvent(tab));
	}
}
