import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { FlavorTextInfo, FlavorTextService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { Observable } from 'rxjs';

@Component({
	standalone: false,
	selector: 'flavor-text-widget',
	styleUrls: ['../../../../css/component/overlays/flavor-text/flavor-text.component.scss'],
	template: `
		<div class="flavor-text-container" *ngIf="flavorText$ | async as flavorText">
			<div class="card-name">{{ flavorText.cardName }}</div>
			<div class="flavor-text">{{ flavorText.flavorText }}</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlavorTextComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	flavorText$: Observable<FlavorTextInfo | null>;

	constructor(
		protected readonly cdr: ChangeDetectorRef,
		private readonly flavorTextService: FlavorTextService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.flavorTextService);

		this.flavorText$ = this.flavorTextService.flavorText$$.pipe(this.mapData((info) => info));

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
