import { ComponentType } from '@angular/cdk/portal';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PackInfo } from '../../../js/models/collection/pack-info';
import { PackStatTooltipComponent } from './pack-stat-tooltip.component';

@Component({
	selector: 'pack-stat',
	styleUrls: [`../../../css/global/scrollbar.scss`, `./pack-stat.component.scss`],
	template: `
		<div
			class="pack-stat"
			[ngClass]="{ 'missing': !totalObtained }"
			componentTooltip
			[componentType]="componentType"
			[componentInput]="_pack"
		>
			<div class="icon-container">
				<img class="icon" [src]="icon" />
			</div>
			<div class="value">{{ totalObtained }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackStatComponent {
	componentType: ComponentType<PackStatTooltipComponent> = PackStatTooltipComponent;

	@Input() set pack(value: InternalPackInfo) {
		this._pack = value;
		this.totalObtained = value.totalObtained;
		this.name = value.name;
		this.icon = `https://static.firestoneapp.com/cardPacks/256/${value.packType}.png`;
	}

	_pack: InternalPackInfo;
	totalObtained: number;
	name: string;
	icon: string;
}

export interface InternalPackInfo extends PackInfo {
	readonly name: string;
	readonly setId: string;
	readonly nextLegendary: number;
	readonly nextEpic: number;
}
