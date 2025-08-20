import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
	standalone: true,
	selector: 'web-arena-filters',
	styleUrls: [`./_web-arena-filters.component.scss`],
	template: `
		<div class="filters">
			<ng-content></ng-content>
		</div>
	`,
	imports: [CommonModule],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebArenaFiltersComponent {}
