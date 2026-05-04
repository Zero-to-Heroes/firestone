import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	standalone: false,
	selector: 'arena-class-stats-matrix-toggle',
	styleUrls: [`./arena-class-stats-matrix-toggle.component.scss`],
	template: `
		<preference-toggle
			class="arena-class-stats-matrix-toggle"
			field="arenaClassStatsMatrixEnabled"
			[label]="'app.arena.filters.class-stats-matrix.label' | owTranslate"
			[helpTooltip]="'app.arena.filters.class-stats-matrix.tooltip' | owTranslate"
		></preference-toggle>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaClassStatsMatrixToggleComponent {}
