import { animate, style, transition, trigger } from '@angular/animations';
import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	Input,
	OnDestroy,
} from '@angular/core';
import { PreferencesService } from '@firestone/shared/common/service';
import { AbstractSubscriptionComponent } from '@firestone/shared/framework/common';
import { waitForReady } from '@firestone/shared/framework/core';

@Component({
	standalone: false,
	selector: 'electron-window-wrapper',
	styleUrls: ['./electron-window-wrapper.component.scss'],
	template: `
		<div class="top" [ngClass]="{ maximized: maximized || !allowResize }">
			<div class="root">
				<div class="background-backup"></div>
				<div class="app-container overlay-container-parent">
					<ng-content></ng-content>
				</div>

				<!-- <version></version> -->
				<div class="screen-capture-effect" *ngIf="screenCaptureOn" [@screenCapture]></div>
			</div>

			<!-- <div class="resize horizontal top" (mousedown)="dragResize($event, 'Top')"></div>
			<div class="resize vertical left" (mousedown)="dragResize($event, 'Left')"></div>
			<div class="resize vertical right" (mousedown)="dragResize($event, 'Right')"></div>
			<div class="resize horizontal bottom" (mousedown)="dragResize($event, 'Bottom')"></div>

			<div class="resize corner top-left" (mousedown)="dragResize($event, 'TopLeft')"></div>
			<div class="resize corner top-right" (mousedown)="dragResize($event, 'TopRight')"></div>
			<div class="resize corner bottom-left" (mousedown)="dragResize($event, 'BottomLeft')"></div>
			<div class="resize corner bottom-right" (mousedown)="dragResize($event, 'BottomRight')"></div> -->
		</div>
	`,
	animations: [
		trigger('screenCapture', [
			transition(':enter', [style({ opacity: 0 }), animate('200ms', style({ opacity: 1 }))]),
			transition(':leave', [style({ opacity: 1 }), animate('200ms', style({ opacity: 0 }))]),
		]),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ElectronWindowWrapperComponent
	extends AbstractSubscriptionComponent
	implements AfterContentInit, OnDestroy
{
	@Input() allowResize = false;
	@Input() avoidGameOverlap = false;

	maximized: boolean;
	screenCaptureOn: boolean;

	constructor(
		protected override readonly cdr: ChangeDetectorRef,
		private readonly prefs: PreferencesService,
	) {
		super(cdr);
	}

	async ngAfterContentInit() {
		await waitForReady(this.prefs);
	}
}
