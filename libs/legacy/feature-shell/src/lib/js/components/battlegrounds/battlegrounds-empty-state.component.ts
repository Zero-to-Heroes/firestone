import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '../../services/localization-facade.service';

@Component({
	selector: 'battlegrounds-empty-state',
	styleUrls: [`../../../css/component/battlegrounds/battlegrounds-empty-state.component.scss`],
	template: `
		<div class="empty-state">
			<div class="loading-icon" [inlineSVG]="emptyStateIcon"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BattlegroundsEmptyStateComponent {
	@Input() title = this.i18n.translateString('battlegrounds.empty-state-title');
	@Input() subtitle = this.i18n.translateString('battlegrounds.empty-state-subtitle');
	@Input() emptyStateIcon = 'assets/svg/ftue/battlegrounds.svg';

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
