import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, ElementRef } from '@angular/core';
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
                <i class="delete-icon" [ngClass]="{'displayed': highlighted }"
                        (click)="requestDeletion($event)" 
                        *ngIf="_thumbnail !== _currentThumbnail">
                    <svg>
                        <use xlink:href="/Files/assets/svg/sprite.svg#delete"/>
                    </svg>
                    <div class="zth-tooltip right" *ngIf="!highlighted">
                        <p>Delete media</p>
                        <svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                            <polygon points="0,0 8,-9 16,0"/>
                        </svg>
                    </div>
                </i>
            </div>
            <div class="completion-date">
                {{ _thumbnail.completionDate }}
            </div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementThumbnailComponent {

    @Output() deletionRequest: EventEmitter<any> = new EventEmitter<any>();
    @Input() highlighted: boolean;

    _thumbnail: ThumbnailInfo;
    _currentThumbnail: ThumbnailInfo;

	@Input() set thumbnail(thumbnail: ThumbnailInfo) {
        this._thumbnail = thumbnail;
    }

	@Input() set currentThumbnail(currentThumbnail: ThumbnailInfo) {
        this._currentThumbnail = currentThumbnail;
    }

    constructor(private el: ElementRef) { 
    }

    requestDeletion(event: MouseEvent) {
        event.preventDefault();
        event.stopPropagation();
        const element = this.el.nativeElement.querySelector('.delete-icon');
        this.deletionRequest.next(element.getBoundingClientRect());
    } 
}