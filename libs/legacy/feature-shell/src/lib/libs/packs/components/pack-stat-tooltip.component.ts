import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { LocalizationFacadeService } from '../../../js/services/localization-facade.service';
import { InternalPackInfo } from './pack-stat.component';
import { EPIC_PITY_TIMER, LEGENDARY_PITY_TIMER } from './pack-stats.component';

@Component({
	selector: 'pack-stat-tooltip',
	styleUrls: [`./pack-stat-tooltip.component.scss`],
	template: `
		<div class="pack-stat-tooltip">
			<div class="packs-recap">{{ packsRecapText }}</div>
			<div class="pity-timers-container">
				<div class="title">
					<i class="i-15 pale-theme">
						<svg class="svg-icon-fill">
							<use xlink:href="assets/svg/sprite.svg#timer" />
						</svg>
					</i>
					<span [owTranslate]="'app.collection.sets.next-guaranteed'"></span>
				</div>
				<div class="pity-timers">
					<div class="progression epic">
						<div class="progress-title">
							<img src="assets/images/rarity/rarity-epic-small.png" />
							<span
								[owTranslate]="'app.collection.sets.in-packs'"
								[translateParams]="{ value: epicTimer }"
							></span>
						</div>
						<div class="progress-bar">
							<div class="progress-bar-filled" [style.width.%]="epicFill"></div>
						</div>
					</div>
					<div class="progression legendary">
						<div class="progress-title">
							<img src="assets/images/rarity/rarity-legendary-small.png" />
							<span
								[owTranslate]="'app.collection.sets.in-packs'"
								[translateParams]="{ value: legendaryTimer }"
							></span>
						</div>
						<div class="progress-bar">
							<div class="progress-bar-filled" [style.width.%]="legendaryFill"></div>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PackStatTooltipComponent {
	@Input() set config(value: InternalPackInfo) {
		this.packsRecapText = this.i18n.translateString('app.collection.pack-stats.pack-stat-tooltip', {
			totalPacks: value.totalObtained,
			packName: value.name,
		});
		this.epicTimer = value.nextEpic || EPIC_PITY_TIMER;
		this.epicFill = ((EPIC_PITY_TIMER - this.epicTimer) / 10) * 100;
		const legendaryPityTimer = value.totalObtained - value.unopened < 10 ? 10 : LEGENDARY_PITY_TIMER;
		this.legendaryTimer = value.nextLegendary || legendaryPityTimer;
		this.legendaryFill = ((legendaryPityTimer - this.legendaryTimer) / legendaryPityTimer) * 100;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}

	packsRecapText: string;
	epicTimer: number;
	epicFill: number;
	legendaryTimer: number;
	legendaryFill: number;

	constructor(private readonly i18n: LocalizationFacadeService, private readonly cdr: ChangeDetectorRef) {}
}
