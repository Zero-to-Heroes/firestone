import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	Input,
	OnDestroy,
} from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { BattlegroundsState } from '../../models/battlegrounds/battlegrounds-state';
import { BgsPanel } from '../../models/battlegrounds/bgs-panel';
import { OverwolfService } from '../../services/overwolf.service';
import { PreferencesService } from '../../services/preferences.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

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
						<menu-selection-bgs></menu-selection-bgs>
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
			<section class="content-container" *ngIf="currentPanel$ | async as currentPanel">
				<div class="title">{{ currentPanel?.name }}</div>
				<ng-container>
					<bgs-hero-selection-overview *ngxCacheIf="currentPanel?.id === 'bgs-hero-selection-overview'">
					</bgs-hero-selection-overview>
					<bgs-next-opponent-overview *ngxCacheIf="currentPanel?.id === 'bgs-next-opponent-overview'">
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
export class BattlegroundsContentComponent extends AbstractSubscriptionComponent implements AfterViewInit, OnDestroy {
	currentPanel$: Observable<BgsPanel>;
	_state: BattlegroundsState;
	windowId: string;

	closeHandler: () => void;

	@Input() set state(value: BattlegroundsState) {
		this._state = value;
	}

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
		private readonly prefs: PreferencesService,
		private readonly store: AppUiStoreFacadeService,
	) {
		super();
		this.currentPanel$ = this.store
			.listenBattlegrounds$(
				([state]) => state.panels,
				([state]) => state.currentPanelId,
			)
			.pipe(
				filter(([panels, currentPanelId]) => !!panels?.length && !!currentPanelId),
				map(([panels, currentPanelId]) => panels.find((panel) => panel.id === currentPanelId)),
				takeUntil(this.destroyed$),
			);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this._state = null;
	}
}
