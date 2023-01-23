import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'overlay-crossed',
	styleUrls: ['./overlay-crossed.component.scss'],
	template: `
		<img
			src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/mulligan_discard.png"
			class="overlay-crossed"
		/>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverlayCrossedComponent {
	image: string;
}
