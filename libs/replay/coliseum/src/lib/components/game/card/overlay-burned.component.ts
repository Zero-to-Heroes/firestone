import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'overlay-burned',
	styleUrls: ['./overlay-burned.component.scss'],
	template: `
		<img
			src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/overlays/burned.png"
			class="overlay-burned"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayBurnedComponent {}
