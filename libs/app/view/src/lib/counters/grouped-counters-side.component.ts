import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { CounterInstance } from '@firestone/game-state';

@Component({
	standalone: false,
	selector: 'grouped-counters-side',
	styleUrls: ['./grouped-counters-side.component.scss'],
	template: `
		<div class="grouped-counters-side {{ side }}">
			<div class="header">{{ side === 'player' ? playerHeader : opponentHeader }}</div>
			<div class="counters">
				<grouped-counters-element
					class="counter"
					*ngFor="let counter of counters"
					[attr.data-id]="counter.id"
					[counter]="counter"
					[side]="side"
				></grouped-counters-element>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupedCountersSideComponent {
	@Input() header: string;
	@Input() counters: readonly CounterInstance<any>[];
	@Input() side: 'player' | 'opponent';

	playerHeader = this.i18n.translateString('counters.grouped.player');
	opponentHeader = this.i18n.translateString('counters.grouped.opponent');

	constructor(private readonly i18n: ILocalizationService) {}
}
