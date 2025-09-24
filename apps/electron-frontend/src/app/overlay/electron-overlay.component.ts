import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'electron-overlay',
	standalone: false,
	template: `
		<div class="electron-overlay-container">
			<div class="widget" cdkDrag></div>
		</div>
	`,
	styleUrls: ['./electron-overlay.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronOverlayComponent {}
