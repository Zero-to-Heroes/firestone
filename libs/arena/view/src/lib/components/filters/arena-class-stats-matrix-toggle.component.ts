import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	standalone: false,
	selector: 'arena-class-stats-matrix-toggle',
	styleUrls: [`./arena-class-stats-matrix-toggle.component.scss`],
	template: `
		<preference-toggle
			class="arena-class-stats-matrix-toggle"
			field="arenaClassStatsMatrixEnabled"
			[label]="'app.arena.filters.class-stats-matrix.label' | fsTranslate"
			[helpTooltip]="'app.arena.filters.class-stats-matrix.tooltip' | fsTranslate"
		></preference-toggle>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassStatsMatrixToggleComponent {}
