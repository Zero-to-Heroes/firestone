import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'overlay-ticked',
	styleUrls: ['./overlay-ticked.component.scss'],
	template: `
		<img
			src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/mulligan_discard.png"
			class="overlay-ticked"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayTickedComponent {
	image: string;
}
