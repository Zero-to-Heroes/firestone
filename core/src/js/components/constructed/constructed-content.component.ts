import { AfterViewInit, ChangeDetectionStrategy, Component, EventEmitter, Input } from '@angular/core';
import { GameState } from '../../models/decktracker/game-state';
import { GameStateEvent } from '../../models/decktracker/game-state-event';
import { GameEvent } from '../../models/game-event';
import { ConstructedCloseWindowEvent } from '../../services/decktracker/event/constructed-close-window-event';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'constructed-content',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/constructed/constructed-content.component.scss`,
	],
	template: `
		<div class="constructed">
			<section class="menu-bar">
				<div class="first">
					<div class="navigation">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#logo" />
							</svg>
						</i>
						<menu-selection-constructed [state]="_state"></menu-selection-constructed>
					</div>
				</div>
				<!-- <hotkey class="exclude-dbclick" [hotkeyName]="'constructed'"></hotkey> -->
				<div class="controls exclude-dbclick">
					<control-bug></control-bug>
					<control-settings [windowId]="windowId" [settingsApp]="'battlegrounds'"></control-settings>
					<control-discord></control-discord>
					<control-minimize [windowId]="windowId"></control-minimize>
					<control-maximize
						[windowId]="windowId"
						[doubleClickListenerParentClass]="'menu-bar'"
						[exludeClassForDoubleClick]="'exclude-dbclick'"
					></control-maximize>
					<control-close
						[windowId]="windowId"
						[eventProvider]="closeHandler"
						[closeAll]="true"
					></control-close>
				</div>
			</section>
			<section class="content-container">
				<section class="main">
					<!-- <div class="title">getTitle()</div> -->
					<in-game-achievements-recap [state]="_state"> </in-game-achievements-recap>
					<in-game-opponent-recap [state]="_state"> </in-game-opponent-recap>
				</section>
				<section class="secondary">
					<secondary-default></secondary-default>
				</section>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedContentComponent implements AfterViewInit {
	@Input() set state(value: GameState) {
		this._state = value;
		this.updateInfo();
	}

	windowId: string;
	_state: GameState;
	closeHandler: () => void;

	private deckUpdater: EventEmitter<GameEvent | GameStateEvent>;

	constructor(private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.deckUpdater = this.ow.getMainWindow().deckUpdater;
		this.closeHandler = () => this.deckUpdater.next(new ConstructedCloseWindowEvent());
	}

	// getTitle(): string {
	// 	switch (this._state?.currentTab) {
	// 		case 'achievements':
	// 			return 'Achievements Progress';
	// 		case 'opponent':
	// 			return 'Opponent';
	// 	}
	// }

	private updateInfo() {
		if (!this._state) {
			return;
		}
	}
}
