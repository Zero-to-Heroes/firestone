import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ConstructedState } from '../../models/constructed/constructed-state';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude: any;

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
						<!-- <menu-selection-constructed [state]="_state"></menu-selection-constructed> -->
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
					<div class="title">Achievements Progress</div>
					<ng-container>
						<in-game-achievements-recap
							*ngxCacheIf="_state?.currentTab === 'achievements'"
							[state]="_state"
						>
						</in-game-achievements-recap>
					</ng-container>
				</section>
				<section class="secondary">
					<!-- <secondary-default></secondary-default> -->
				</section>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstructedContentComponent {
	@Input() set state(value: ConstructedState) {
		console.log('setting state', value);
		this._state = value;
		this.updateInfo();
	}

	windowId: string;
	_state: ConstructedState;

	closeHandler: () => void;

	constructor(private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		// this.closeHandler = () => this.battlegroundsUpdater.next(new BgsCloseWindowEvent());
	}

	private updateInfo() {
		if (!this._state) {
			return;
		}
	}
}
