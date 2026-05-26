import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener } from '@angular/core';
import { PreferencesService, ScalingService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { GameInfoService, OverwolfService } from '@firestone/shared/framework/core';
import { DebugService } from '../../services/debug.service';

@Component({
	standalone: false,
	selector: 'battlegrounds',
	styleUrls: [],
	template: `
		<window-wrapper [activeTheme]="'battlegrounds'" [allowResize]="true" [avoidGameOverlap]="true">
			<battlegrounds-root></battlegrounds-root>
		</window-wrapper>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsComponent extends AbstractSubscriptionComponent implements AfterViewInit {
	windowId: string;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly ow: OverwolfService,
		private readonly gameInfo: GameInfoService,
		private readonly init_Debug: DebugService,
		private readonly init_ScalingService: ScalingService,
	) {
		super(cdr);
		this.init();
	}

	private async init() {
		// this.ow.getTwitterUserInfo();
		// this.ow.getRedditUserInfo();
	}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.positionWindowOnSecondScreen();
	}

	@HostListener('mousedown', ['$event'])
	dragMove(event: MouseEvent) {
		const path: any[] = event.composedPath();
		// Hack for drop-downs
		if (
			path.length > 2 &&
			path[0].localName === 'div' &&
			path[0].className?.includes('options') &&
			path[1].localName === 'div' &&
			path[1].className?.includes('below')
		) {
			return;
		}
		this.ow.dragMove(this.windowId);
	}

	private async positionWindowOnSecondScreen() {
		const [monitorsList, gameInfo, prefs] = await Promise.all([
			this.ow.getMonitorsList(),
			this.gameInfo.getRunningGameInfo(),
			this.prefs.getPreferences(),
		]);
		if (monitorsList.displays.length === 1 || prefs.bgsUseOverlay) {
			return;
		}

		const mainMonitor = gameInfo?.monitorHandle?.value ?? -1;
		if (mainMonitor !== -1) {
			const secondMonitor = monitorsList.displays.filter(
				(monitor) => (monitor.handle?.value ?? monitor.id) !== mainMonitor,
			)[0];
			this.ow.changeWindowPosition(this.windowId, secondMonitor.x + 100, secondMonitor.y + 100);
		}
	}
}
