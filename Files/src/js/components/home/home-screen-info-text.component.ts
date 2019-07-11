import { Component, AfterViewInit, OnInit, ViewEncapsulation, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef } from '@angular/core';

import { CollectionManager } from '../../services/collection/collection-manager.service';
import { RealTimeNotificationService } from '../../services/real-time-notifications.service';
import { OverwolfService } from '../../services/overwolf.service';

@Component({
	selector: 'home-screen-info-text',
	styleUrls: [`../../../css/component/home/home-screen-info-text.component.scss`],
	encapsulation: ViewEncapsulation.None,
	template: `
		<div class="home-screen-info" *ngIf="dataLoaded">
			<div class="app-title">
				<i class="i-35 gold-theme left">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
					</svg>
				</i>
				<span class="title">Welcome to Firestone</span>
				<i class="i-35 gold-theme right">
					<svg class="svg-icon-fill">
						<use xlink:href="/Files/assets/svg/sprite.svg#title_decor"/>
					</svg>
				</i>
			</div>
			<span class="sub-title" [innerHTML]="status" [ngClass]="{'ftue': ftue}"></span>
			<span class="sub-title sub-title-details" [innerHTML]="statusDetails"></span>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})

export class HomeScreenInfoTextComponent implements AfterViewInit {

	dataLoaded = false;
	status: string;
	statusDetails: string;
	ftue: boolean;

	constructor(
            private notificationService: RealTimeNotificationService,
            private cdr: ChangeDetectorRef,
            private ow: OverwolfService,
			private collectionManager: CollectionManager) { }

	ngAfterViewInit() {
        this.cdr.detach();
        this.ow.addStateChangedListener('WelcomeWindow', (message) => {
			if (message.window_state == 'normal') {
				this.refreshContents();
			}
		});
		this.refreshContents();
	}

	private async refreshContents() {
        const inGame = await this.ow.inGame();
        if (inGame) {
            this.status = "Firestone now follows your Hearthstone session.";
            this.dataLoaded = true;
            if (!(<ViewRef>this.cdr).destroyed) {
                this.cdr.detectChanges();
            }
        }
        else {
            this.status = "No Hearthstone session detected.";
            const collection = await this.collectionManager.getCollection();
            if (!collection || collection.length == 0) {
                this.status = "Please launch Hearthstone to synchronize your collection.";
                this.statusDetails = null;
                this.ftue = true;
            }
            else {
                this.statusDetails = "Choose an ability:";
            }
            this.dataLoaded = true;
            if (!(<ViewRef>this.cdr).destroyed) {
                this.cdr.detectChanges();
            }
        }
	}
}
