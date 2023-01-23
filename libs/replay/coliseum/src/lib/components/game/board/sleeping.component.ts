import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'sleeping',
	styleUrls: ['../../../text.scss', './sleeping.component.scss'],
	template: `
		<div class="sleeping">
			<img
				class="sleeping-icon"
				src="https://static.zerotoheroes.com/hearthstone/asset/coliseum/images/exhausted.png"
			/>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SleepingComponent {}
