import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';

@Component({
	standalone: false,
	selector: 'arena-tip-popup',
	styleUrls: [`./arena-tip-popup.component.scss`],
	template: `
		<div class="arena-tip-popup tooltip-mouse-over-target" *ngIf="tip">
			<div class="tip-content" [innerHTML]="tip"></div>
			<div class="tip-meta" *ngIf="author || patchInfo">
				<span class="author" *ngIf="author">{{ author }}</span>
				<span class="patch-info" *ngIf="patchInfo">{{ patchInfo }}</span>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArenaTipPopupComponent {
	@Input() set config(
		value: { tip: string; author?: string; patchNumber?: number; date?: string } | null | undefined,
	) {
		this.tip = value?.tip ?? null;
		this.author = value?.author ?? null;
		this.patchInfo = this.buildPatchInfo(value?.patchNumber, value?.date);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	tip: string | null = null;
	author: string | null = null;
	patchInfo: string | null = null;

	constructor(private readonly cdr: ChangeDetectorRef) {}

	private buildPatchInfo(patchNumber?: number, date?: string): string | null {
		const parts: string[] = [];
		if (patchNumber != null) {
			parts.push(`Patch ${patchNumber}`);
		}
		if (date) {
			parts.push(date);
		}
		return parts.length ? parts.join(' · ') : null;
	}
}
