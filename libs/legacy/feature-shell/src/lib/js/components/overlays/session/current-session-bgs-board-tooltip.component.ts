import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { Entity } from '@firestone-hs/replay-parser';
import { LocalizationFacadeService } from '../../../services/localization-facade.service';

@Component({
	selector: 'current-session-bgs-board-tooltip',
	styleUrls: [
		`../../../../css/global/reset-styles.scss`,
		`../../../../css/component/battlegrounds/in-game/bgs-opponent-overview-big.component.scss`,
		`../../../../css/component/overlays/session/current-session-bgs-board-tooltip.component.scss`,
	],
	template: `
		<div class="board-tooltip" *ngIf="_boardMinions?.length">
			<bgs-board [entities]="_boardMinions"></bgs-board>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentSessionBgsBoardTooltipComponent {
	@Input() set config(value: readonly Entity[]) {
		this._boardMinions = value ?? [];
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr?.detectChanges();
		}
	}

	_boardMinions: readonly Entity[] = [];

	constructor(private readonly cdr: ChangeDetectorRef, private readonly i18n: LocalizationFacadeService) {}
}
