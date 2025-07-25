import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SettingsControllerService } from '../services/settings-controller.service';

@Component({
	standalone: false,
	selector: 'settings-search',
	styleUrls: [`./settings-search.component.scss`],
	template: `
		<fs-text-input
			(fsModelUpdate)="onTextChanged($event)"
			[placeholder]="'battlegrounds.sim.hero-search-placeholder' | fsTranslate"
		>
		</fs-text-input>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSearchComponent {
	constructor(private readonly controller: SettingsControllerService) {}

	onTextChanged(newText: string) {
		this.controller.newSearchString(newText);
	}
}
