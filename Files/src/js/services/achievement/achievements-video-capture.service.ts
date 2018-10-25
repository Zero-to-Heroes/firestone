import { Injectable } from '@angular/core';

import { Events } from '../events.service';
import { GameEvents } from '../game-events.service';
import { GameEvent } from '../../models/game-event';
import { Achievement } from '../../models/achievement';

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

	constructor(private gameEvents: GameEvents, private events: Events) {
		this.gameEvents.allEvents.subscribe((gameEvent: GameEvent) => this.handleRecording(gameEvent));
        this.events.on(Events.ACHIEVEMENT_COMPLETE).subscribe((data) => this.onAchievementComplete(data));
    }
    
    private handleRecording(gameEvent: GameEvent) {
        if (gameEvent.type === GameEvent.GAME_START) {
            overwolf.media.replays.turnOn(
                this.settings, 
                (result) => console.log('[recording] turned on replay capture', result));
        }
        else if (gameEvent.type === GameEvent.GAME_END) {
            this.turnOff();
        }
    }

    private turnOff() {
        if (this.captureOngoing) {
            setTimeout(() => this.turnOff(), 500);
            return;
        }
        overwolf.media.replays.turnOff((result) => console.log('[recording] turned off replay capture', result));
    }

    private onAchievementComplete(data) {
        const achievement: Achievement = data.data[0];
        const numberOfCompletions: number = data.data[1];
        console.log('[recording] achievment complete', achievement, numberOfCompletions);
        this.capture(achievement, numberOfCompletions);
    }

    private capture(achievement: Achievement, numberOfCompletions: number) {
        overwolf.media.replays.getState((result) => {
            // console.log('[recording] is recording on?', result);
            if (!result.isOn) {
                setTimeout(() => this.capture(achievement, numberOfCompletions), 50);
                return;
            }
            // Here we can have custom settings based on achievement
            this.captureOngoing = true;
            this.events.broadcast(Events.ACHIEVEMENT_RECORD_STARTED, achievement.id);
            overwolf.media.replays.capture(
                15000,
                10000,
                (captureFinished) => {
                    if (captureFinished.status === 'error') {
                        return;
                    }
                    this.captureOngoing = false;
                    const replayInfo = {
                        path: captureFinished.path,
                        thumbnail: captureFinished.thumbnail_path
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
