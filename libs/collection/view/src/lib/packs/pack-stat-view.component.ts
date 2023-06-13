import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { PackInfo } from './pack-info';

@Component({
	selector: 'pack-stat-view',
	styleUrls: [`./pack-stat-view.component.scss`],
	template: `
		<div class="pack-stat" [ngClass]="{ missing: !totalObtained }" [attr.aria-label]="name">
			<div class="icon-container">
				<img class="icon" [src]="icon" />
			</div>
			<div class="value">{{ totalObtained }}</div>
			<img
				class="next-legendary-soon"
				src="assets/images/rarity/rarity-legendary.png"
				[helpTooltip]="nextLegendarySoonTooltip"
				*ngIf="nextLegendaryComingSoon"
			/>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackStatViewComponent {
	@Input() set pack(value: InternalPackInfo) {
		this._pack = value;
		this.totalObtained = value.totalObtained;
		this.name = value.name;
		// Not a big fan of how it looks like for now. Will probably revisit this later on
		// Mostly, it adds an icon on many packs that might not be buyable right now
		// Also, if the user bought a pack while Firestone was not running, it might show a very
		// visible icon without the user being able to do anything about it, which is
		// more annoying than just having an incorrect value of the counter
		this.nextLegendaryComingSoon = false; //value.nextLegendary <= 10;
		this.icon = `https://static.firestoneapp.com/cardPacks/256/${value.packType}.png`;
	}

	_pack: InternalPackInfo;
	totalObtained: number;
	name: string;
	icon: string;
	nextLegendaryComingSoon: boolean;
	nextLegendarySoonTooltip: string;
}

export interface InternalPackInfo extends PackInfo {
	readonly name: string;
	readonly setId: string;
	readonly nextLegendary?: number;
	readonly nextEpic?: number;
}
