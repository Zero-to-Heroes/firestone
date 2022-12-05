import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';

@Component({
	selector: 'mercenaries-empty-state',
	styleUrls: [`../../../../css/component/mercenaries/desktop/mercenaries-empty-state.component.scss`],
	template: `
		<div class="empty-state">
			<div class="loading-icon" inlineSVG="assets/svg/ftue/mercenaries.svg"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MercenariesEmptyStateComponent {
	@Input() title = this.i18n.translateString('mercenaries.empty-state.title');
	@Input() subtitle = this.i18n.translateString('mercenaries.empty-state.subtitle');

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
