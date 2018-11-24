import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, ElementRef, SimpleChanges, OnChanges, AfterViewInit, HostListener } from '@angular/core';
import { VisualAchievement } from '../../models/visual-achievement';
import { DomSanitizer, SafeUrl, SafeHtml } from '@angular/platform-browser';
import { ReplayInfo } from '../../models/replay-info';
import { SimpleIOService } from '../../services/plugins/simple-io.service';
import { AchievementsStorageService } from '../../services/achievement/achievements-storage.service';
import { Events } from '../../services/events.service';

declare var overwolf;

@Component({
	selector: 'achievement-recordings',
	styleUrls: [`../../../css/component/achievements/achievement-recordings.component.scss`],
	template: `
        <div class="achievement-recordings" *ngIf="currentThumbnail">
            <vg-player [ngClass]="{'deleted': currentThumbnail.isDeleted}">
                <div class="title" [innerHTML]="title"></div>
                <vg-overlay-play></vg-overlay-play>

                <vg-controls>
                    <vg-play-pause></vg-play-pause>            
                    <vg-time-display vgProperty="current" vgFormat="mm:ss"></vg-time-display>
                    <vg-time-display vgProperty="total" vgFormat="mm:ss"></vg-time-display>
            
                    <vg-scrub-bar [vgSlider]="true">
                        <vg-scrub-bar-current-time [vgSlider]="true"></vg-scrub-bar-current-time>
                    </vg-scrub-bar>
            
                    <vg-mute></vg-mute>
                    <vg-volume></vg-volume>
                    
                    <i class="video-folder" (click)="openVideoFolder()">
                        <svg>
                            <use xlink:href="/Files/assets/svg/sprite.svg#video_folder"/>
                        </svg>
                    </i>
            
                    <vg-fullscreen [ngClass]="{ 'fullscreen': fullscreen }"></vg-fullscreen>
                </vg-controls>

                <video [vgMedia]="media" #media id="singleVideo" preload="auto">
                    <source [src]="currentReplay" type="video/mp4">
                </video>
            </vg-player>
            <div class="no-media" *ngIf="currentThumbnail.isDeleted">
                <i>
                    <svg>
                        <use xlink:href="/Files/assets/svg/sprite.svg#no_media"/>
                    </svg>
                </i>
                <span>Media deleted</span>
            </div>

            <ul class="thumbnails">
                <li *ngFor="let thumbnail of thumbnails"
                    (click)="showReplay(thumbnail, $event)" 
                    [ngClass]="{'active': thumbnail === currentThumbnail}">
                    <div class="thumbnail" [ngClass]="{'missing': thumbnail.isDeleted}">
                        <img [src]="thumbnail.thumbnail" *ngIf="!thumbnail.isDeleted">
                        <div class="media-missing" *ngIf="thumbnail.isDeleted"></div>
                        <div class="overlay"></div>
                        <div class="icon" [innerHTML]="thumbnail.iconSvg"></div>
                        <div class="media-missing-text" *ngIf="thumbnail.isDeleted">Media missing</div>
                        <i class="delete-icon" (click)="deleteMedia(thumbnail, $event)" *ngIf="thumbnail !== currentThumbnail">
                            <svg>
                                <use xlink:href="/Files/assets/svg/sprite.svg#delete"/>
                            </svg>
                            <div class="zth-tooltip right">
                                <p>Delete media</p>
                                <svg class="tooltip-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 9">
                                    <polygon points="0,0 8,-9 16,0"/>
                                </svg>
                            </div>
                        </i>
                    </div>
                    <div class="completion-date">
                        {{ thumbnail.completionDate }}
                    </div>
                </li>
            </ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementRecordingsComponent implements AfterViewInit {

    _achievement: VisualAchievement;
    thumbnails: ThumbnailInfo[] = [];

    currentThumbnail: ThumbnailInfo;
    currentReplayLocation: string;
    currentReplay: SafeUrl;
    title: SafeHtml;
    fullscreen: boolean = false;

    private player;

	@Input() set achievement(achievement: VisualAchievement) {
        this._achievement = achievement;
        setTimeout(() => {
            this.updateThumbnails(achievement.replayInfo);
            this.cdr.detectChanges();            
        })
    }

    constructor(
        private io: SimpleIOService,
        private storage: AchievementsStorageService,
        private events: Events,
        private elRef: ElementRef, 
        private cdr: ChangeDetectorRef, 
        private sanitizer: DomSanitizer) { 
    }
    
    ngAfterViewInit() {
        this.player = this.elRef.nativeElement.querySelector('video');
        if (!this.player) {
            setTimeout(() => this.ngAfterViewInit(), 50);
        }
    }

    showReplay(thumbnail: ThumbnailInfo, event: MouseEvent) {
        event.stopPropagation();
        // const isDeleteClicked = event["path"]
        //         .map((element) => element.className)
        //         .find((className) => className.indexOf('delete-icon') !== -1);
        // if (isDeleteClicked) {
        //     return;
        // }
        console.log('showing replay', thumbnail, event);
        this.updateThumbnail(thumbnail);
        this.player.load();
        this.player.play();
        this.cdr.detectChanges();
    }

    openVideoFolder() {
        overwolf.utils.openWindowsExplorer(this.currentReplayLocation, (result) => { console.log('opened', result) });
    }

    async deleteMedia(thumbnail: ThumbnailInfo, event: MouseEvent) {
        console.log('deleting media', thumbnail, event);
        event.preventDefault();
        event.stopPropagation();
        const result: boolean = thumbnail.isDeleted || await this.io.deleteFile(thumbnail.videoPath);
        if (result) {
            const updatedAchievement = await this.storage.removeReplay(thumbnail.stepId, thumbnail.videoPath);
            console.log('updated achievement after deletion', updatedAchievement);
            const replayInfoAfterDeletion = this._achievement.replayInfo
                    .filter((info) => info.path !== thumbnail.videoPath);
            console.log('replay info after deletion', replayInfoAfterDeletion);
            this.events.broadcast(Events.ACHIEVEMENT_UPDATED, updatedAchievement.id);
            // this.updateThumbnails(replayInfoAfterDeletion);
        }
    }

    private async isDeleted(path: string): Promise<boolean> {
        const fileExists = await this.io.fileExists(path);
        console.log('fileExists in component?', fileExists);
        return !fileExists;
    }

    private async buildDeletedPaths(replayInfo: ReadonlyArray<ReplayInfo>): Promise<string[]> {
        const deletedPaths: string[] = [];
        for (let info of replayInfo) {
            console.log('considering delete', info, info.path);
            const isDeleted: boolean = await this.isDeleted(info.path);
            console.log('is deleted?', isDeleted);
            if (isDeleted) {
                deletedPaths.push(info.path);
            }
        }
        console.log('deleted', deletedPaths);
        return deletedPaths;
    }
    
	// Prevent the window from being dragged around if user drags controls
	@HostListener('mousedown', ['$event'])
	onHistoryClick(event: MouseEvent) {
        const path: any[] = event["path"];
        for (let elem of path) {
            if (elem.localName === 'vg-controls') {
                event.stopPropagation();
                return;
            }
        }
    }

	@HostListener('document:webkitfullscreenchange', ['$event'])
	onFullScreenChange(event) {
        this.fullscreen = !this.fullscreen;
        this.cdr.detectChanges();
    }

    private async updateThumbnails(replayInfo: ReadonlyArray<ReplayInfo>) {
        const deletedPaths: string[] = await this.buildDeletedPaths(replayInfo);
        this.thumbnails = replayInfo
                .map((info) => {
                    return {
                        timestamp: info.creationTimestamp,
                        completionDate: new Date(info.creationTimestamp).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "2-digit", year: "2-digit"} ),
                        videoLocation: info.url,
                        videoPath: info.path,
                        videoUrl: this.sanitizer.bypassSecurityTrustUrl(info.url),
                        thumbnail: this.sanitizer.bypassSecurityTrustUrl(info.thumbnailUrl),
                        stepId: info.completionStepId,
                        iconSvg: this.buildIconSvg(info.completionStepId),
                        isDeleted: deletedPaths.indexOf(info.path) !== -1,
                    } as ThumbnailInfo
                })
                .sort((a, b) => b.timestamp - a.timestamp);
        console.log('updated thumbnails', this.thumbnails);
        this.updateThumbnail(this.thumbnails[0]);
        this.cdr.detectChanges();
    }
    
    private updateThumbnail(thumbnail: ThumbnailInfo) {
        console.log('updating thumbnail', thumbnail);
        this.currentThumbnail = thumbnail;
        this.currentReplayLocation = this.currentThumbnail 
                ? this.currentThumbnail.videoLocation 
                : undefined;
        this.currentReplay = this.currentReplayLocation 
                ? this.sanitizer.bypassSecurityTrustUrl(this.currentReplayLocation) 
                : undefined;
        this.updateTitle();
    }

    private updateTitle() {
        if (!this.currentThumbnail) {
            return;
        }
        const date = new Date(this.currentThumbnail.timestamp).toLocaleDateString(
                "en-GB",
                { day: "2-digit", month: "2-digit", year: "2-digit"} );
        this.title = this.sanitizer.bypassSecurityTrustHtml(`
            <i class="icon">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#${this.buildIcon(this.currentThumbnail.stepId)}"/>
                </svg>
            </i>
            <div class="text">${this.buildText()}</div>
            <div class="date">${date}</div>
        `);
    }

    private buildIconSvg(stepId: string) {
        return this.sanitizer.bypassSecurityTrustHtml(`
            <i class="icon-svg">
                <svg class="svg-icon-fill">
                    <use xlink:href="/Files/assets/svg/sprite.svg#${this.buildIcon(stepId)}"/>
                </svg>
            </i>`);
    }

    private buildIcon(stepId: string): string {
        return this._achievement.completionSteps
                .find((step) => step.id === stepId)
                .iconSvgSymbol;
    }

    private buildText(): string {
        return this._achievement.completionSteps
                .find((step) => step.id === this.currentThumbnail.stepId)
                .text(false);
    }
}

interface ThumbnailInfo {
    readonly timestamp: number;
    readonly completionDate: string;
    readonly videoLocation: string;
    readonly videoPath: string;
    readonly thumbnail: SafeUrl;
    readonly videoUrl: SafeUrl;
    readonly iconSvg: SafeHtml;
    readonly stepId: string;
    readonly isDeleted: boolean;
}