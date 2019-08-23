import { Component, Input, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

@Component({
	selector: 'opponent-card-info',
	styleUrls: [
		'../../../../css/global/components-global.scss',
		'../../../../css/component/matchoverlay/opponenthand/opponent-card-info.component.scss',
	],
	template: `
		<ul class="opponent-card-info">
			<span class="turn-number">{{ _turn }}</span>
		</ul>
	`,
})
export class OpponentCardInfoComponent implements OnInit {
	_turn: number | 'M';

	constructor(private logger: NGXLogger) {}

	ngOnInit(): void {}

	@Input() set turn(value: number | 'M') {
		this._turn = value;
	}
}
