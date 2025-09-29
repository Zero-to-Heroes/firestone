/* eslint-disable @typescript-eslint/no-empty-function */
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardChoiceOption } from './choosing-card-widget-wrapper.component';

@Component({
	standalone: false,
	selector: 'choosing-card-additional-info',
	styleUrls: ['./choosing-card-additional-info.component.scss'],
	template: `
		<div class="additional-info" *ngIf="willBeActive">
			<div
				class="will-be-active"
				*ngIf="willBeActive"
				[helpTooltip]="'decktracker.overlay.discover.will-be-active-tooltip' | fsTranslate"
				[innerHTML]="'decktracker.overlay.discover.will-be-active' | fsTranslate"
			></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChoosingCardAdditionalInfoComponent {
	@Input() set option(value: CardChoiceOption) {
		this.willBeActive = value?.willBeActive;
	}

	willBeActive: boolean;
}
