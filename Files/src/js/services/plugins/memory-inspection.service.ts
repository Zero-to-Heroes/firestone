import { Injectable } from '@angular/core';

import { DungeonInfo } from '../../models/dungeon-info'
import { Card } from '../../models/card';
import { Events } from '../events.service';

declare var OverwolfPlugin: any;
declare var overwolf: any;
declare var parseCardsText: any;

@Injectable()
export class MemoryInspectionService {

    private triesLeft = 50;

	readonly g_interestedInFeatures = [
		'scene_state',
		'collection',
	];

	constructor(private events: Events) {
		overwolf.games.onGameInfoUpdated.addListener((res) => {
			if (this.gameLaunched(res)) {
			  	this.registerEvents();
			  	setTimeout(() => this.setFeatures(), 1000);
			}
			// console.log("[memory service] onGameInfoUpdated: ", res);
		});
		overwolf.games.getRunningGameInfo((res) => {
			if (this.gameRunning(res)) {
			  	this.registerEvents();
			  	setTimeout(() => this.setFeatures(), 1000);
			}
			// console.log("[memory service] getRunningGameInfo: ", res);
		});
	}

	public getCollection(delay: number = 0): Promise<Card[]> {
        this.triesLeft = 20;
		return new Promise<Card[]>((resolve) => {
            this.getCollectionInternal((collection: Card[]) => {
                resolve(collection);
            }, delay);
		});
    }
    
    private getCollectionInternal(callback, delay: number = 0) {
        this.triesLeft--;
        // I observed some cases where the new card information was not present in the memory reading
        // right after I had gotten it from a pack, so let's add a little delay
        setTimeout(() => {
            overwolf.games.events.getInfo((info: any) => {
                if (!info.res || !info.res.collection) {
                    // If game is running, we should have something in the collection
                    // This might cause an issue if we're dealing with someone who has zero 
                    // cards in their collection, but it's unlikely that totally beginners would 
                    // use an app
                    // console.log('[memory service] [collection-manager] no collection info', info);
                    overwolf.games.getRunningGameInfo((res: any) => {
                        if (this.gameRunning(res) && this.triesLeft > 0) {
                            console.log('[memory service] [collection-manager] game is running, GEP should return a collection. Waiting...')
                            setTimeout(() => this.getCollectionInternal(callback, delay), 2000);
                            return;
                        }
                        else {
                            // setTimeout(() => { this.getCollection(callback) }, 100);
                            callback([]);
                            return;
                        }
                    });
                }
                // console.log('[memory service] [collection-manager] collection info', info);
                const collection: Card[] = (<any>Object).values(info.res.collection)
                        .map(strCard => JSON.parse(strCard));
                // console.log('callback', collection);
                callback(collection);
            })
        }, delay);
	}

	private handleInfoUpdate(info) {
		if (info.feature === 'scene_state') {
			console.log("[memory service] INFO UPDATE: ", info, info.feature, info.info);
			this.events.broadcast(Events.SCENE_CHANGED, info.info.game_info.scene_state);
		}
	}

	private registerEvents() {
		// general events errors
		overwolf.games.events.onError.addListener((info) => {
		  	console.log("[memory service] Error: ", info);
		});
	  
		// "static" data changed
		// This will also be triggered the first time we register
		// for events and will contain all the current information
		overwolf.games.events.onInfoUpdates2.addListener((info) => this.handleInfoUpdate(info));
	  
		// an event triggerd
		overwolf.games.events.onNewEvents.addListener((info) => {
		  	console.log("[memory service] EVENT FIRED: ", info);
		});
	}

	private setFeatures() {
		overwolf.games.events.setRequiredFeatures(this.g_interestedInFeatures, (info) => {
		  	if (info.status == "error") {
				//console.log("Could not set required features: " + info.reason);
				//console.log("Trying in 2 seconds");
				window.setTimeout(() => this.setFeatures(), 2000);
				return;
		  	}
		  	console.log("[memory service] Set required features:");
		  	console.log("[memory service] ", info);
		});
	}

	private gameLaunched(gameInfoResult) {
		if (!gameInfoResult) {
		  	return false;
		}
		if (!gameInfoResult.gameInfo) {
		  	return false;
		}
		if (!gameInfoResult.runningChanged && !gameInfoResult.gameChanged) {
		  	return false;
		}
		if (!gameInfoResult.gameInfo.isRunning) {
		  	return false;
		}
        // Only detect new game launched events when it goes from not running to running
        return gameInfoResult.runningChanged || gameInfoResult.gameChanged;
	}
	  
	private gameRunning(gameInfo) { 
		if (!gameInfo) {
		  	return false;
		}
		if (!gameInfo.isRunning) {
		  	return false;
		}
		// NOTE: we divide by 10 to get the game class id without it's sequence number
		if (Math.floor(gameInfo.id/10) != 9898) {
		  	return false;
		}
		return true;
	}
}
