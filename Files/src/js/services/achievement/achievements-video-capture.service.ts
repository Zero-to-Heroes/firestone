import { Injectable } from '@angular/core';

import { Events } from '../events.service';
import { GameEvents } from '../game-events.service';
import { GameEvent } from '../../models/game-event';
import { Achievement } from '../../models/achievement';
import { ReplayInfo } from 'src/js/models/replay-info';
import { AchievementConfigService } from './achievement-config.service';
import { keyframes } from '@angular/animations';

declare var overwolf;

@Injectable()
export class AchievementsVideoCaptureService {

    readonly settings = {
        "settings": {
            "video": { "buffer_length": 40000 },
            "audio": {
                "mic": {
                    "volume": 100,
                    "enabled": true
                },
                "game": {
                    "volume": 75,
                    "enabled": true
                }
            },
            "peripherals": { "capture_mouse_cursor": "both" }
        }
    }

    private captureOngoing: boolean = false;

	constructor(private gameEvents: GameEvents, private events: Events, private config: AchievementConfigService) {
		// this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => this.handleRecording(gameEvent));
        this.events.on(Events.ACHIEVEMENT_COMPLETE).subscribe((data) => this.onAchievementComplete(data));
        
        // Keep recording on, as otherwise it makes it more difficult to calibrate the achievement timings
        overwolf.media.replays.turnOn(
            this.settings, 
            (result) => console.log('[recording] turned on replay capture', result));

        // setTimeout(() => {
        //     this.setStreamingModes();
        // });
    }

    // private setStreamingModes() {
    //     // Only capture the game window + the notification window
	// 	overwolf.windows.getWindowsStates((result) => {
	// 		if (result.status !== 'success') {
	// 			console.warn('Could not get windows', result);
	// 			return;
    //         }
    //         console.log('[recording] got windows', result);
    //         Object.keys(result.result).forEach((windowName) => {
    //             console.log('[recording] iterating', windowName);
    //             overwolf.windows.obtainDeclaredWindow(windowName, (window) => {
    //                 if (window.name === 'NotificationsWindow') {
    //                     overwolf.streaming.setWindowStreamingMode(
    //                         window.id, 
    //                         'Always', 
    //                         (result) => console.log('[recording] streaming mode', window, result));
    //                 }
    //                 // Hide all other windows in the video replay
    //                 else {
    //                     overwolf.streaming.setWindowStreamingMode(
    //                         window.id, 
    //                         'Never', 
    //                         (result) => console.log('[recording] streaming mode', window, result));
    //                 }
    //             })
    //         })
	// 	});
    // }
    
    // private handleRecording(gameEvent: GameEvent) {
    //     if (gameEvent.type === GameEvent.GAME_START) {
    //     }
    //     else if (gameEvent.type === GameEvent.GAME_END) {
    //         this.turnOff();
    //     }
    // }

    // private turnOff() {
    //     if (this.captureOngoing) {
    //         setTimeout(() => this.turnOff(), 500);
    //         return;
    //     }
    //     overwolf.media.replays.turnOff((result) => console.log('[recording] turned off replay capture', result));
    // }

    private onAchievementComplete(data) {
        const achievement: Achievement = data.data[0];
        const numberOfCompletions: number = data.data[1];
        console.log('[recording] achievment complete', achievement, numberOfCompletions);
        this.capture(achievement, numberOfCompletions);
    }

    private capture(achievement: Achievement, numberOfCompletions: number) {
        if (!this.captureOngoing) {
            this.events.broadcast(Events.ACHIEVEMENT_RECORD_STARTED, achievement.id);
        }
        overwolf.media.replays.getState((result) => {
            // Here we can have custom settings based on achievement
            this.captureOngoing = true;
            const conf = this.config.getConfig(achievement.type);
            console.log('[recording] using conf', conf);
            overwolf.media.replays.capture(
                conf.timeToRecordBeforeInMillis,
                conf.timeToRecordAfterInMillis,
                (captureFinished) => {
                    if (captureFinished.status === 'error') {
                        return;
                    }
                    this.captureOngoing = false;
                    const replayInfo: ReplayInfo = {
                        creationTimestamp: Date.now(),
                        path: captureFinished.path,
                        url: captureFinished.url,
                        thumbnailUrl: captureFinished.thumbnail_url,
                        thumbnailPath: captureFinished.thumbnail_path
                    }
                    this.events.broadcast(Events.ACHIEVEMENT_RECORDED, achievement.id, replayInfo);
                    console.log('[recording] capture finished', captureFinished, achievement, numberOfCompletions);
                },
                (result) => {
                    if (result.status === 'error') {
                        // console.log('[recording] error while capturing', result);
                        setTimeout(() => this.capture(achievement, numberOfCompletions), 50);
                        return;
                    }
                    console.log('[recording] capture started', result, achievement, numberOfCompletions);
                }
            );
        })
    }
}
