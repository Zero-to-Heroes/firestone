import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
} from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map, takeUntil, tap } from 'rxjs/operators';
import { BgsGame } from '../../models/battlegrounds/bgs-game';
import { BgsPanel } from '../../models/battlegrounds/bgs-panel';
import { OverwolfService } from '../../services/overwolf.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { cdLog } from '../../services/ui-store/app-ui-store.service';
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
			<section
				class="content-container"
				*ngIf="{ currentPanel: currentPanel$ | async, currentGame: currentGame$ | async } as value"
			>
				<div class="title">{{ value.currentPanel?.name }}</div>
				<ng-container>
					<bgs-hero-selection-overview *ngxCacheIf="value.currentPanel?.id === 'bgs-hero-selection-overview'">
					</bgs-hero-selection-overview>
					<bgs-next-opponent-overview *ngxCacheIf="value.currentPanel?.id === 'bgs-next-opponent-overview'">
					</bgs-next-opponent-overview>
					<bgs-post-match-stats
						*ngxCacheIf="value.currentPanel?.id === 'bgs-post-match-stats'"
						[panel]="value.currentPanel"
						[game]="value.currentGame"
					>
					</bgs-post-match-stats>
					<bgs-battles
						*ngxCacheIf="value.currentPanel?.id === 'bgs-battles'"
						[panel]="value.currentPanel"
						[game]="value.currentGame"
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
	currentGame$: Observable<BgsGame>;

	windowId: string;

	closeHandler: () => void;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly ow: OverwolfService,
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
				// distinctUntilChanged(),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting currentPanel in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
		this.currentGame$ = this.store
			.listenBattlegrounds$(([state]) => state.currentGame)
			.pipe(
				// TODO: narrow down the model to avoid having too many refreshes
				map(([currentGame]) => currentGame),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((info) => cdLog('emitting currentGame in ', this.constructor.name, info)),
				takeUntil(this.destroyed$),
			);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		super.ngOnDestroy();
	}
}
