import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, ViewRef } from '@angular/core';
import { BgsToggleOverlayWindowEvent } from '../../../services/battlegrounds/store/events/bgs-toggle-overlay-window-event';
import { BattlegroundsStoreEvent } from '../../../services/battlegrounds/store/events/_battlegrounds-store-event';
import { DebugService } from '../../../services/debug.service';
import { OverwolfService } from '../../../services/overwolf.service';
import { PreferencesService } from '../../../services/preferences.service';

declare let amplitude;

@Component({
	selector: 'battlegrounds-overlay-button',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		`../../../../css/themes/battlegrounds-theme.scss`,
		'../../../../css/component/battlegrounds/overlay/battlegrounds-overlay-button.component.scss',
	],
	template: `
		<div class="battlegrounds-overlay-button" [activeTheme]="'battlegrounds'">
			<div
				class="battlegrounds-widget"
				[ngClass]="{ big: big }"
				(mouseup)="toggleOverlay()"
				[helpTooltip]="'battlegrounds.overlay-button.tooltip' | owTranslate"
			>
				<div class="icon idle"></div>
				<div class="icon active"></div>
			</div>
			<!-- <control-close class="close" [windowId]="windowId"></control-close> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsOverlayButtonComponent {
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
		this.battlegroundsUpdater = (await this.ow.getMainWindow()).battlegroundsUpdater;
	}

	private mouseDownStart: number;

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
}
