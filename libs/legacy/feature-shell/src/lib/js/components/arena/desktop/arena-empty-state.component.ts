import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'arena-empty-state',
	styleUrls: [`../../../../css/component/arena/desktop/arena-empty-state.component.scss`],
	template: `
		<div class="empty-state">
			<div class="loading-icon" inlineSVG="assets/svg/ftue/arena.svg"></div>
			<span class="title">{{ title }}</span>
			<span class="subtitle">{{ subtitle }}</span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaEmptyStateComponent {
	@Input() title = this.i18n.translateString('app.arena.empty-state.title');
	@Input() subtitle = this.i18n.translateString('app.arena.empty-state.subtitle');

	constructor(private readonly i18n: LocalizationFacadeService) {}
}
