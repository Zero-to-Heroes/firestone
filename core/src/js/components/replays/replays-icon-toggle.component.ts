import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	selector: 'replays-icon-toggle',
	styleUrls: [`../../../css/component/replays/replays-icon-toggle.component.scss`],
	template: `
		<preference-toggle
			class="replays-icon-toggle"
			field="replaysShowClassIcon"
			[label]="'app.replays.class-icon-toggle.label' | owTranslate"
			[helpTooltip]="'app.replays.class-icon-toggle.tooltip' | owTranslate"
		></preference-toggle>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReplayIconToggleComponent {}
