import {
	AfterViewInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	HostListener,
	ViewEncapsulation,
	ViewRef,
} from '@angular/core';
import { BgsToggleOverlayWindowEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-overlay-window-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

declare let amplitude;

@Component({
	selector: 'battlegrounds-overlay-button',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		`../../../../css/global/cdk-overlay.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/battlegrounds/overlay/battlegrounds-overlay-button.component.scss',
	],
	template: `
		<div class="battlegrounds-overlay-button overlay-container-parent" [activeTheme]="'battlegrounds'">
			<div
				class="battlegrounds-widget"
				[ngClass]="{ 'big': big }"
				(mouseup)="toggleOverlay()"
				helpTooltip="Click to show / hide the app window"
			>
				<div class="icon idle"></div>
				<div class="icon active"></div>
			</div>
			<control-close class="close" [windowId]="windowId"></control-close>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None, // Needed to the cdk overlay styling to work
})
export class BattlegroundsOverlayButtonComponent implements AfterViewInit {
	windowId: string;
	big: boolean;

	// private isDragging = false;
	private battlegroundsUpdater: EventEmitter<BattlegroundsStoreEvent>;

	constructor(
		private prefs: PreferencesService,
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private init_DebugService: DebugService,
	) {}

	async ngAfterViewInit() {
		this.windowId = (await this.ow.getCurrentWindow()).id;
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
		await this.restoreWindowPosition();
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	private mouseDownStart: number;

	@HostListener('mousedown')
	dragMove() {
		this.mouseDownStart = Date.now();
		this.ow.dragMove(this.windowId, async (result) => {
			const window = await this.ow.getCurrentWindow();
			if (!window) {
				return;
			}
			this.prefs.updateBgsOverlayButtonPosition(window.left, window.top);
		});
	}

	toggleOverlay() {
		// Assume it's a drag and do nothing
		if (Date.now() - this.mouseDownStart > 150) {
			return;
		}
		this.big = true;
		this.battlegroundsUpdater.next(new BgsToggleOverlayWindowEvent());
		amplitude.getInstance().logEvent('battlegrounds-widget-toggle');
		setTimeout(() => {
			this.big = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 150);
	}

	private async restoreWindowPosition(): Promise<void> {
		const gameInfo = await this.ow.getRunningGameInfo();
		if (!gameInfo) {
			return;
		}
		const prefs = await this.prefs.getPreferences();
		const trackerPosition = prefs.bgsOverlayButtonPosition;
		// TODO: default to bottom right corner
		const newLeft = (trackerPosition && trackerPosition.left) || 10;
		const newTop = (trackerPosition && trackerPosition.top) || 10;
		await this.ow.changeWindowPosition(this.windowId, newLeft, newTop);
	}
}
