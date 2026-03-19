import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, ViewRef } from '@angular/core';
import { ILocalizationService } from '@firestone/shared/framework/core';
import { ArenaClassInfoTip } from './model';

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
	@Input() set config(value: ArenaClassInfoTip | null | undefined) {
		this.tip = value?.tip ?? null;
		this.author = value?.author ?? null;
		this.patchInfo = this.buildPatchInfo(value?.patch, value?.date);
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.markForCheck();
		}
	}

	tip: string | null = null;
	author: string | null = null;
	patchInfo: string | null = null;

	constructor(
		private readonly cdr: ChangeDetectorRef,
		private readonly i18n: ILocalizationService,
	) {}

	private buildPatchInfo(patch?: string, date?: string): string | null {
		const parts: string[] = [];
		if (patch != null) {
			parts.push(`${patch}`);
		}
		if (date) {
			const formattedDate = new Date(date).toLocaleDateString(this.i18n.formatCurrentLocale() ?? 'en-US', {
				year: 'numeric',
				month: 'numeric',
				day: 'numeric',
			});
			parts.push(formattedDate);
		}
		return parts.length ? parts.join(' · ') : null;
	}
}
