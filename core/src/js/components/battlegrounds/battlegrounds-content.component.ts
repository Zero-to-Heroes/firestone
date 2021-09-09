import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	Input,
	OnDestroy,
	ViewRef,
} from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../models/battlegrounds/bgs-panel';
import { Preferences } from '../../models/preferences';
import { BgsCloseWindowEvent } from '../../services/battlegrounds/store/events/bgs-close-window-event';
import { BattlegroundsStoreEvent } from '../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';

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
								<use xlink:href="assets/svg/sprite.svg#logo" />
							</svg>
						</i>
						<menu-selection-bgs
							[selectedPanel]="currentPanel?.id"
							[matchOver]="_state?.currentGame?.gameEnded"
						></menu-selection-bgs>
					</div>
				</div>
				<hotkey class="exclude-dbclick" [hotkeyName]="'battlegrounds'"></hotkey>
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
				<div class="title">{{ currentPanel?.name }}</div>
				<ng-container>
					<bgs-hero-selection-overview *ngxCacheIf="currentPanel?.id === 'bgs-hero-selection-overview'">
					</bgs-hero-selection-overview>
					<bgs-next-opponent-overview
						*ngxCacheIf="currentPanel?.id === 'bgs-next-opponent-overview'"
						[panel]="currentPanel"
						[game]="_state?.currentGame"
						[enableSimulation]="enableSimulation"
					>
					</bgs-next-opponent-overview>
					<bgs-post-match-stats
						*ngxCacheIf="currentPanel?.id === 'bgs-post-match-stats'"
						[panel]="currentPanel"
						[game]="_state?.currentGame"
					>
					</bgs-post-match-stats>
					<bgs-battles
						*ngxCacheIf="currentPanel?.id === 'bgs-battles'"
						[panel]="currentPanel"
						[game]="_state?.currentGame"
					>
					</bgs-battles>
				</ng-container>
			</section>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsContentComponent implements AfterViewInit, OnDestroy {
	_state: BattlegroundsState;
	currentPanel: BgsPanel;
	enableSimulation: boolean;
	windowId: string;

	closeHandler: () => void;

	@Input() set state(value: BattlegroundsState) {
		this._state = value;
		this.currentPanel = this._state?.panels?.find((panel) => panel.id === value.currentPanelId);

		// console.log('sett state in -content', value, this.currentStage, this.currentPanel);
	}

	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;
	private preferencesSubscription: Subscription;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
	) {}

	async ngAfterViewInit() {
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		this.windowId = (await this.ow.getCurrentWindow()).id;
		// console.log('after view init in bgs content');
		const preferencesEventBus: BehaviorSubject<any> = this.ow.getMainWindow().preferencesEventBus;
		this.preferencesSubscription = preferencesEventBus.subscribe((event) => {
			this.handleDisplayPreferences(event.preferences);
		});
		this.closeHandler = () => this.battlegroundsUpdater.next(new BgsCloseWindowEvent());
		await this.handleDisplayPreferences();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.preferencesSubscription?.unsubscribe();
		this._state = null;
	}

	private async handleDisplayPreferences(preferences: Preferences = null) {
		preferences = preferences || (await this.prefs.getPreferences());
		// console.log('updating prefs', preferences);
		this.enableSimulation = preferences.bgsEnableSimulation;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
