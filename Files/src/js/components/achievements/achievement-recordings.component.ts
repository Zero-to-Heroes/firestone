import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewRef, ElementRef, SimpleChanges, OnChanges } from '@angular/core';
import { trigger, state, transition, style, animate } from '@angular/animations';
import { VisualAchievement } from '../../models/visual-achievement';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { ReplaySubject } from 'rxjs';

@Component({
	selector: 'achievement-recordings',
	styleUrls: [`../../../css/component/achievements/achievement-recordings.component.scss`],
	template: `
        <div class="achievement-recordings">
            <video controls *ngIf="!replayBeingRecorded">
                <source [src]="currentReplay" type="video/mp4">
            </video>
            <div *ngIf="replayBeingRecorded">Replay being recorded, it will refresh automatically when done</div>
            <ul class="thumbnails">
                <li *ngFor="let thumbnail of thumbnails">
                    <img [src]="thumbnail.thumbnail" (click)="currentReplay = thumbnail.videoUrl">
                </li>
            </ul>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class AchievementRecordingsComponent implements OnChanges {

    _achievement: VisualAchievement;
    replayBeingRecorded: boolean;
    currentReplay: SafeUrl;
    thumbnails: ThumbnailInfo[];

	@Input() set achievement(achievement: VisualAchievement) {
        this._achievement = achievement;
        if (achievement.replayInfo[0].url !== 'tmp') {
            this.currentReplay = this.sanitizer.bypassSecurityTrustUrl(achievement.replayInfo[0].url);
            this.thumbnails = achievement.replayInfo
                    .map((info) => ({ 
                        thumbnail: this.sanitizer.bypassSecurityTrustUrl(info.thumbnailUrl),
                        videoUrl: this.sanitizer.bypassSecurityTrustUrl(info.url),
                    }));
            this.replayBeingRecorded = false;
        }
        else {
            this.replayBeingRecorded = true;
        }
    }

    constructor(private elRef: ElementRef, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) { }
    
    ngOnChanges(changes: SimpleChanges): void {
        if (changes.currentReplay) {
            const player = this.elRef.nativeElement.querySelector('video');
            player.load();
            player.play();
            this.cdr.detectChanges();
            console.log('detected changes');
        }
      }
}

interface ThumbnailInfo {
    readonly thumbnail: SafeUrl;
    readonly videoUrl: SafeUrl;
}