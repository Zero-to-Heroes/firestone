import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { AchievementsStorageService } from '../../services/achievement/achievements-storage.service';
import { Events } from '../../services/events.service';
import { ThumbnailInfo } from '../../models/achievement/thumbnail-info';

@Component({
	selector: 'achievement-thumbnail',
	styleUrls: [`../../../css/component/achievements/achievement-thumbnail.component.scss`],
	template: `
        <div [ngClass]="{'active': _thumbnail === _currentThumbnail}" class="achievement-thumbnail">
            <div class="thumbnail" [ngClass]="{'missing': _thumbnail.isDeleted}">
                <img [src]="_thumbnail.thumbnail" *ngIf="!_thumbnail.isDeleted">
                <div class="media-missing" *ngIf="_thumbnail.isDeleted"></div>
                <div class="overlay"></div>
                <div class="icon" [innerHTML]="_thumbnail.iconSvg"></div>
                <div class="media-missing-text" *ngIf="_thumbnail.isDeleted">Media missing</div>
                <i class="delete-icon" [ngClass]="{'displayed': showConfirmationPopup }"
                        (click)="activateConfirmationPopup($event)" 
                        *ngIf="_thumbnail !== _currentThumbnail">
                    <svg>
                        <use xlink:href="/Files/assets/svg/sprite.svg#delete"/>
                    </svg>
                    <div class="zth-tooltip right" *ngIf="!showConfirmationPopup">
                        <p>Delete media</p>
                        <svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                            <polygon points="0,0 8,-9 16,0"/>
                        </svg>
                    </div>
                </i>
                <div class="zth-tooltip confirmation-popup right" *ngIf="showConfirmationPopup">
                    <p>Are you sure?</p>
                    <div class="buttons">
                        <button (click)="hideConfirmationPopup($event)" class="cancel"><span>Cancel</span></button>
                        <button (click)="deleteMedia($event)" class="confirm"><span>Delete</span></button>
                    </div>
                    <svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                        <polygon points="0,0 8,-9 16,0"/>
                    </svg>
                </div>
            </div>
            <div class="completion-date">
                {{ _thumbnail.completionDate }}
            </div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementThumbnailComponent {

    _thumbnail: ThumbnailInfo;
    _currentThumbnail: ThumbnailInfo;
    showConfirmationPopup: boolean;

	@Input() set thumbnail(thumbnail: ThumbnailInfo) {
        this._thumbnail = thumbnail;
    }

	@Input() set currentThumbnail(currentThumbnail: ThumbnailInfo) {
        this._currentThumbnail = currentThumbnail;
    }

    constructor(
        private io: SimpleIOService,
        private storage: AchievementsStorageService,
        private events: Events,
        private cdr: ChangeDetectorRef) { 
    }

    activateConfirmationPopup(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.showConfirmationPopup = true;
        this.cdr.detectChanges();
    }

    hideConfirmationPopup(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        this.showConfirmationPopup = false;
        this.cdr.detectChanges();
    }

    async deleteMedia(event: MouseEvent) {
        console.log('deleting media', this._thumbnail, event);
        event.preventDefault();
        event.stopPropagation();
        const result: boolean = this._thumbnail.isDeleted || await this.io.deleteFile(this._thumbnail.videoPath);
        if (result) {
            const updatedAchievement = await this.storage.removeReplay(this._thumbnail.stepId, this._thumbnail.videoPath);
            // console.log('updated achievement after deletion', updatedAchievement);
            this.events.broadcast(Events.ACHIEVEMENT_UPDATED, updatedAchievement.id);
        }
    }
}