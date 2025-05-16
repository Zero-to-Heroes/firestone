import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { BgsInGameWindowNavigationService } from '@firestone/battlegrounds/common';
import { OverwolfService } from '@firestone/shared/framework/core';

@Component({
	selector: 'battlegrounds-overlay-button',
	styleUrls: [
		`../../../../css/global/cdk-overlay.scss`,
		// `../../../../css/themes/battlegrounds-theme.scss`,
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

	constructor(
		private cdr: ChangeDetectorRef,
		private ow: OverwolfService,
		private readonly nav: BgsInGameWindowNavigationService,
	) {}

	private mouseDownStart: number;

	toggleOverlay() {
		// Assume it's a drag and do nothing
		if (Date.now() - this.mouseDownStart > 150) {
			return;
		}
		this.big = true;
		this.nav.toggleWindow();
		setTimeout(() => {
			this.big = false;
			if (!(this.cdr as ViewRef)?.destroyed) {
				this.cdr.detectChanges();
			}
		}, 150);
	}
}
