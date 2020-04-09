import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	ViewRef,
} from '@angular/core';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../models/battlegrounds/bgs-panel';
import { BgsStage } from '../../models/battlegrounds/bgs-stage';
import { BattlegroundsStoreEvent } from '../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../services/overwolf.service';

declare let amplitude: any;

@Component({
	selector: 'battlegrounds-content',
	styleUrls: [
		`../../../css/global/components-global.scss`,
		`../../../css/component/battlegrounds/battlegrounds-content.component.scss`,
	],
	template: `
		<div class="battlegrounds" *ngIf="_state">
			<section class="menu-bar">
				<!-- <main-window-navigation [navigation]="state.navigation"></main-window-navigation> -->
				<div class="first">
					<div class="navigation">
						<i class="i-117X33 gold-theme logo">
							<svg class="svg-icon-fill">
								<use xlink:href="/Files/assets/svg/sprite.svg#logo" />
							</svg>
						</i>
						<menu-selection-bgs [selectedStage]="currentStage?.id"></menu-selection-bgs>
					</div>
				</div>
				<!-- <hotkey-bgs></hotkey-bgs> -->
				<div class="controls">
					<control-bug></control-bug>
					<control-settings [windowId]="windowId"></control-settings>
					<control-discord></control-discord>
					<control-minimize [windowId]="windowId"></control-minimize>
					<control-maximize
						[windowId]="windowId"
						[doubleClickListenerParentClass]="'menu-bar'"
					></control-maximize>
					<control-close [windowId]="windowId"></control-close>
				</div>
			</section>
			<section class="content-container" *ngIf="currentPanel">
				<div class="title">{{ currentPanel.name }}</div>
				<ng-container [ngSwitch]="currentPanel.id">
					<bgs-hero-selection-overview *ngSwitchCase="'bgs-hero-selection-overview'" [panel]="currentPanel">
					</bgs-hero-selection-overview>
					<bgs-next-opponent-overview
						*ngSwitchCase="'bgs-next-opponent-overview'"
						[panel]="currentPanel"
						[game]="_state.currentGame"
					>
					</bgs-next-opponent-overview>
					<bgs-post-match-stats *ngSwitchCase="'bgs-post-match-stats'" [panel]="currentPanel">
					</bgs-post-match-stats>
				</ng-container>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsContentComponent implements AfterViewInit {
	_state: BattlegroundsState;
	currentStage: BgsStage;
	currentPanel: BgsPanel;
	windowId: string;

	@Input() set state(value: BattlegroundsState) {
		this._state = value;
		this.currentStage = value?.stages?.find(stage => stage.id === value.currentStageId);
		this.currentPanel = this.currentStage?.panels?.find(panel => panel.id === value.currentPanelId);

		console.log('setting state', value, this.currentStage, this.currentPanel);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		this.windowId = (await this.ow.getCurrentWindow()).id;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
