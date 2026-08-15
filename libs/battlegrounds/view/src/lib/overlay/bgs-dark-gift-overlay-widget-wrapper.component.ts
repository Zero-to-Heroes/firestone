import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	standalone: false,
	selector: 'bgs-dark-gift-overlay-widget-wrapper',
	styleUrls: ['./bgs-dark-gift-overlay-widget-wrapper.component.scss'],
	template: ` <bgs-dark-gift-overlay></bgs-dark-gift-overlay> `,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsDarkGiftOverlayWidgetWrapperComponent {}
