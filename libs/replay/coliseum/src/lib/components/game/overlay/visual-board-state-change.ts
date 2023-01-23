import { animate, style, transition, trigger } from '@angular/animations';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'visual-board-state-change',
	styleUrls: ['./visual-board-state-change.component.scss'],
	template: `
		<div class="visual-board-state-change">
			<div class="state {{ style }}">
				<img class="splash" [src]="image" />
				<div class="text">
					<svg viewBox="0 0 56 18">
						<text x="0" y="15">{{ text }}</text>
					</svg>
				</div>
			</div>
		</div>
	`,
	animations: [
		trigger('fadeInOut', [
			transition(':enter', [style({ width: 0 }), animate(300, style({ width: '100%' }))]),
			transition(':leave', [style({ width: '100%' }), animate(300, style({ width: 0 }))]),
		]),
	],
	// eslint-disable-next-line @angular-eslint/no-host-metadata-property
	host: { '[@fadeInOut]': 'in' },
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VisualBoardStateChangeComponent {
	style: string;
	image: string;
	text: string;

	@Input() set state(value: number) {
		this.style = value === 1 ? 'recruit' : 'combat';
		const img = value === 1 ? 'recruit' : 'combat';
		this.image = `https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/battlegrounds/${img}.png`;
		this.text = value === 1 ? 'Recruit' : 'Combat';
	}
}
