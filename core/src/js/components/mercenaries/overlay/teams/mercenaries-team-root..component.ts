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
import { debounceTime, filter, map, tap } from 'rxjs/operators';
import { MercenariesBattleState, MercenariesBattleTeam } from '../../../../models/mercenaries/mercenaries-battle-state';
import { OverwolfService } from '../../../../services/overwolf.service';
import { AppUiStoreService, cdLog } from '../../../../services/ui-store/app-ui-store.service';

@Component({
	selector: 'mercenaries-team-root',
	styleUrls: [
		'../../../../../css/global/components-global.scss',
		`../../../../../css/global/cdk-overlay.scss`,
		`../../../../../css/themes/decktracker-theme.scss`,
		'../../../../../css/component/mercenaries/overlay/teams/mercenaries-team-root.component.scss',
	],
	template: `
		<div class="root overlay-container-parent" [activeTheme]="'decktracker'">
			<!-- Never remove the scalable from the DOM so that we can perform resizing even when not visible -->
			<div class="scalable">
				<ng-container *ngIf="{ team: team$ | async } as value">
					<div class="team-container">
						<div class="team" *ngIf="!!value.team" [style.width.px]="overlayWidthInPx">
							<div class="background"></div>
							<mercenaries-team-control-bar [windowId]="windowId"></mercenaries-team-control-bar>
							<mercenaries-team-list [team]="value.team"> </mercenaries-team-list>
							<div class="backdrop" *ngIf="showBackdrop"></div>
						</div>
					</div>
				</ng-container>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesTeamRootComponent implements AfterViewInit, OnDestroy {
	@Input() teamExtractor: (state: MercenariesBattleState) => MercenariesBattleTeam;

	team$: Observable<MercenariesBattleTeam>;

	windowId: string;
	overlayWidthInPx = 190;

	private gameInfoUpdatedListener: (message: any) => void;

	constructor(
		private readonly store: AppUiStoreService,
		private readonly ow: OverwolfService,
		private readonly cdr: ChangeDetectorRef,
	) {
		this.team$ = this.store
			.listenMercenaries$(([battleState, prefs]) => battleState)
			.pipe(
				tap((info) => console.debug('info', info)),
				debounceTime(50),
				filter(([battleState]) => !!battleState),
				map(([battleState]) => this.teamExtractor(battleState)),
				// FIXME
				tap((filter) => setTimeout(() => this.cdr.detectChanges(), 0)),
				tap((filter) => cdLog('emitting team in ', this.constructor.name, filter)),
			);
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.gameInfoUpdatedListener = this.ow.addGameInfoUpdatedListener(async (res: any) => {
			if (res && res.resolutionChanged) {
				console.log('[decktracker-overlay] received new game info', res);
				await this.changeWindowSize();
				// await this.restoreWindowPosition(true);
			}
		});
		await this.changeWindowSize();
	}

	ngOnDestroy() {
		this.ow.removeGameInfoUpdatedListener(this.gameInfoUpdatedListener);
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		// console.log('starting drag');
		// this.tooltipPosition = 'none';
		// if (!(this.cdr as ViewRef)?.destroyed) {
		// 	this.cdr.detectChanges();
		// }
		this.ow.dragMove(this.windowId, async (result) => {
			// console.log('drag finished, updating position');
			// await this.updateTooltipPosition();
			const window = await this.ow.getCurrentWindow();
			// console.log('retrieved window', window);
			if (!window) {
				return;
			}

			// console.log('updating tracker position', window.left, window.top);
			// this.trackerPositionUpdater(window.left, window.top);
		});
	}

	private async changeWindowSize(): Promise<void> {
		const width = 252 * 3; // Max scale
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const gameHeight = gameInfo.logicalHeight;
		await this.ow.changeWindowSize(this.windowId, width, gameHeight);
		// await this.restoreWindowPosition();
		// await this.updateTooltipPosition();
	}
}
