import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'duels-empty-state',
	styleUrls: [`../../../../css/component/duels/desktop/duels-empty-state.component.scss`],
	template: `
		<div class="empty-state">
			<div class="loading-icon" inlineSVG="assets/svg/ftue/duels.svg"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DuelsEmptyStateComponent {
	@Input() title = this.i18n.translateString('app.duels.empty-state.title');
	@Input() subtitle = this.i18n.translateString('app.duels.empty-state.subtitle');

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
