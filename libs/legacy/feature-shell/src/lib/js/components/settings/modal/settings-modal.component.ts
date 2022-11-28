import {
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	HostListener,
	OnDestroy,
	OnInit,
	ViewRef,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { Events } from '../../../services/events.service';

@Component({
	selector: 'settings-modal',
	styleUrls: [
		`../../../../css/global/components-global.scss`,
		`../../../../css/component/settings/modal/settings-modal.component.scss`,
	],
	template: `
		<div class="settings-modal" *ngIf="currentModal">
			<ng-container [ngSwitch]="currentModal">
				<modal-video-settings-changed *ngSwitchCase="'video-capture'" (dismiss)="closeModal()">
				</modal-video-settings-changed>
			</ng-container>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsModalComponent implements OnInit, OnDestroy {
	currentModal: string;

	private eventsSubscription: Subscription;

	constructor(private events: Events, private cdr: ChangeDetectorRef) {}

	ngOnInit() {
		this.eventsSubscription = this.events
			.on(Events.SETTINGS_DISPLAY_MODAL)
			.subscribe((data) => this.handleNewModal(data));
	}

	@HostListener('window:beforeunload')
	ngOnDestroy() {
		this.eventsSubscription?.unsubscribe();
	}

	closeModal() {
		this.currentModal = undefined;
	}

	private handleNewModal(data) {
		this.currentModal = data.data[0];
		if (!(this.cdr as ViewRef)?.destroyed) {
			this.cdr.detectChanges();
		}
	}
}
