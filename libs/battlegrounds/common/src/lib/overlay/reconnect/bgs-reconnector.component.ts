import { AfterContentInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewRef } from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';
import { BgsReconnectorService } from './bgs-reconnector.service';

@Component({
	selector: 'bgs-reconnector',
	styleUrls: ['./bgs-reconnector.component.scss'],
	template: ` <div class="reconnector battlegrounds-theme" (click)="reconnect()">
		<div class="reconnect-button">Click to reconnect</div>
		<div class="error-message" *ngIf="errorMessage">{{ errorMessage }}</div>
	</div>`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BgsReconnectorComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	errorMessage: string | undefined;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
		private readonly reconnectService: BgsReconnectorService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);

		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}

	async reconnect() {
		const status = await this.reconnectService.reconnect();
		if (status === 'Not elevated') {
			this.showErrorMessage('You need to run Overwolf as administrator to enable the reconnection feature');
		}
	}

	private showErrorMessage(message: string) {
		this.errorMessage = message;
		setTimeout(() => {
			this.errorMessage = undefined;
			if (!(this.cdr as ViewRef).destroyed) {
				this.cdr.detectChanges();
			}
		}, 5000);
		if (!(this.cdr as ViewRef).destroyed) {
			this.cdr.detectChanges();
		}
	}
}
