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
		<div class="battlegrounds">
			<section class="menu-bar">
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
				<hotkey [hotkeyName]="'battlegrounds'"></hotkey>
				<div class="controls">
					<control-bug></control-bug>
					<control-settings [windowId]="windowId" [settingsApp]="'battlegrounds'"></control-settings>
					<control-discord></control-discord>
					<control-minimize [windowId]="windowId"></control-minimize>
					<control-maximize
						[windowId]="windowId"
						[doubleClickListenerParentClass]="'menu-bar'"
					></control-maximize>
					<control-close [windowId]="windowId"></control-close>
				</div>
			</section>
			<section class="content-container">
				<div class="title">{{ currentPanel?.name }}</div>
				<ng-container>
					<bgs-hero-selection-overview
						[hidden]="currentPanel?.id !== 'bgs-hero-selection-overview'"
						[panel]="currentPanel"
					>
					</bgs-hero-selection-overview>
					<bgs-next-opponent-overview
						[hidden]="currentPanel?.id !== 'bgs-next-opponent-overview'"
						[panel]="currentPanel"
						[game]="_state?.currentGame"
					>
					</bgs-next-opponent-overview>
					<bgs-post-match-stats
						[hidden]="currentPanel?.id !== 'bgs-post-match-stats'"
						[panel]="currentPanel"
						[game]="_state?.currentGame"
					>
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

		console.log('setting stateeee', value, this.currentStage, this.currentPanel);
	}

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(private readonly cdr: ChangeDetectorRef, private readonly ow: OverwolfService) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		this.windowId = (await this.ow.getCurrentWindow()).id;
		console.log('after view init in bgs content');
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
