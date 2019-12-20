import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

@Component({
	selector: 'window-wrapper',
	styleUrls: [
		`../../css/global/components-global.scss`,
		`../../css/global/cdk-overlay.scss`,
		`../../css/component/window-wrapper.component.scss`,
		`../../css/themes/collection-theme.scss`,
		`../../css/themes/achievements-theme.scss`,
		`../../css/themes/decktracker-theme.scss`,
		`../../css/themes/replays-theme.scss`,
		`../../css/themes/general-theme.scss`,
	],
	template: `
		<div class="top">
			<div class="root">
				<div class="app-container overlay-container-parent">
					<ng-content></ng-content>
				</div>

				<version></version>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
	encapsulation: ViewEncapsulation.None,
})
export class WindowWrapperComponent {}
