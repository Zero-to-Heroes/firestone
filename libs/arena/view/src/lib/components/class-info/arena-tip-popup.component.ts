import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	standalone: false,
	selector: 'arena-tip-popup',
	styleUrls: [`./arena-tip-popup.component.scss`],
	template: `
		<div class="arena-tip-popup tooltip-mouse-over-target" *ngIf="tip">
			<div class="tip-content" [innerHTML]="tip"></div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaTipPopupComponent {
	@Input() set config(value: { tip: string } | null | undefined) {
		this.tip = value?.tip ?? null;
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	tip: string | null = null;

	constructor(private readonly cdr: ChangeDetectorRef) {}
}
