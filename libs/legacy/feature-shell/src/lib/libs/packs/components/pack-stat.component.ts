import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { InternalPackInfo } from '@firestone/collection/view';
import { PackStatTooltipComponent } from './pack-stat-tooltip.component';

@Component({
	selector: 'pack-stat',
	styleUrls: [`./pack-stat.component.scss`],
	template: `
		<pack-stat-view
			class="pack-stat"
			[pack]="pack"
			componentTooltip
			[componentType]="componentType"
			[componentInput]="pack"
			[componentTooltipAllowMouseOver]="true"
		>
		</pack-stat-view>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackStatComponent {
	componentType: ComponentType<PackStatTooltipComponent> = PackStatTooltipComponent;

	@Input() pack: InternalPackInfo;
}
