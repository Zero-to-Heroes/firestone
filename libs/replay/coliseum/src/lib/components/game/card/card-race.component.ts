import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
	selector: 'card-race',
	styleUrls: ['../../../text.scss', './card-race.component.scss'],
	template: `
		<div class="card-race" cardElementResize [fontSizeRatio]="0.1">
			<img
				class="banner"
				src="https://static.zerotoheroes.com/hearthstone/asset/manastorm/card/race-banner.png"
			/>
			<div class="text" resizeTarget>{{ _race }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardRaceComponent {
	_race: string;

	@Input() set race(value: string) {
		console.debug('[card-race] setting race', value);
		this._race = value;
	}
}
