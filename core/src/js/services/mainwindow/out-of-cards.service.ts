import { EventEmitter, Injectable, Optional } from '@angular/core';
import { SceneMode } from '@firestone-hs/reference-data';
import { AllCardsService } from '@firestone-hs/replay-parser';
import { Card } from '../../models/card';
import { GameEvent } from '../../models/game-event';
import { ApiRunner } from '../api-runner';
import { CollectionManager } from '../collection/collection-manager.service';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { OverwolfService } from '../overwolf.service';
import { PreferencesService } from '../preferences.service';

const COLLECTION_UPLOAD = `https://outof.cards/api/hearthstone/collection/import/`;
const REFRESH_DEBOUNCE_MS = 30 * 1000;
@Injectable()
export class OutOfCardsService {
	public stateUpdater = new EventEmitter<any>();

	private refreshTimer;

	constructor(
		private prefs: PreferencesService,
		private api: ApiRunner,
		// These are not needed for generating tokens
		@Optional() private allCards: AllCardsService,
		@Optional() private collectionManager: CollectionManager,
		@Optional() private events: Events,
		@Optional() private ow: OverwolfService,
		@Optional() private gameEvents: GameEventsEmitterService,
	) {
		window['outOfCardsAuthUpdater'] = this.stateUpdater;
		this.stateUpdater.subscribe((token: OutOfCardsToken) => {
			console.log('[ooc-auth] received access token', token);
			this.handleToken(token);
		});

		this.initCollectionRefreshListeners();
	}

	private async initCollectionRefreshListeners() {
		if (this.events) {
			this.events.on(Events.NEW_PACK).subscribe(event => this.queueCollectionRefresh());
		}

		if (this.gameEvents) {
			this.gameEvents.allEvents.subscribe((event: GameEvent) => {
				if (event.type === GameEvent.SCENE_CHANGED_MINDVISION) {
					const newScene: SceneMode = event.additionalData.scene;
					if (newScene === SceneMode.COLLECTIONMANAGER) {
						this.queueCollectionRefresh();
					}
				}
			});
		}

		if (this.ow) {
			this.ow.addGameInfoUpdatedListener(async (res: any) => {
				if ((await this.ow.inGame()) && res.gameChanged) {
					this.queueCollectionRefresh();
				}
			});
			if (await this.ow.inGame()) {
				this.queueCollectionRefresh();
			}
		}
		console.log('[ooc-auth] handler init done');
	}

	public async generateToken(code: string): Promise<OutOfCardsToken> {
		const requestString = `code=${code}&grant_type=authorization_code&redirect_uri=https://www.firestoneapp.com/ooc-login.html&client_id=oqEn7ONIAOmugFTjFQGe1lFSujGxf3erhNDDTvkC`;
		const token: OutOfCardsToken = await this.api.callPostApi('https://outof.cards/oauth/token/', requestString, {
			contentType: 'application/x-www-form-urlencoded',
		});
		if (!token) {
			return null;
		}

		const tokenWithExpiry: OutOfCardsToken = {
			...token,
			expires_timestamp: Date.now() + 1000 * token.expires_in,
		};
		return tokenWithExpiry;
	}

	private async handleToken(token: OutOfCardsToken) {
		await this.prefs.udpateOutOfCardsToken(token);
		this.uploadCollection();
	}

	private async queueCollectionRefresh() {
		if (this.refreshTimer) {
			clearTimeout(this.refreshTimer);
		}
		this.refreshTimer = setTimeout(() => {
			this.uploadCollection();
		}, REFRESH_DEBOUNCE_MS);
	}

	// TODO: add timer when listening to events, so that the collection is not uploaded right away
	// (e.g. if the user opens many packs)
	private async uploadCollection() {
		const token: OutOfCardsToken = await this.getToken();
		console.debug('[ooc-auth] retrieved token', token);
		if (!token) {
			console.debug('[ooc-auth] no token, not synchronizing collection');
			return;
		}

		console.log('[ooc-auth] starting collection sync');
		const collection = await this.collectionManager.getCollection();
		const oocCollection: OocCollection = this.transformCollection(collection);
		console.debug('[ooc-auth] transformed collection for upload', oocCollection);
		const result = await this.api.callPostApi(COLLECTION_UPLOAD, oocCollection, {
			bearerToken: token.access_token,
		});
		console.log('[ooc-auth] collection sync result', result);
	}

	private async getToken(): Promise<OutOfCardsToken> {
		let token: OutOfCardsToken = (await this.prefs.getPreferences()).outOfCardsToken;
		if (token && Date.now() - token.expires_timestamp > 0) {
			console.debug('[ooc-auth] token expired', Date.now(), token.expires_timestamp);
			if (token.refresh_token) {
				console.debug('[ooc-auth] refreshing token');
				token = await this.refreshToken(token.refresh_token);
				console.debug('[ooc-auth] refreshed token', token);
			}
		} else {
			console.debug(
				'[ooc-auth] token not expired',
				Date.now(),
				token.expires_timestamp,
				Date.now() - token.expires_timestamp,
			);
		}
		return token;
	}

	private async refreshToken(refresh_token: string): Promise<OutOfCardsToken> {
		const requestString = `grant_type=refresh_token&refresh_token=${refresh_token}&client_id=oqEn7ONIAOmugFTjFQGe1lFSujGxf3erhNDDTvkC&scope=hearthcollection`;
		const token: OutOfCardsToken = await this.api.callPostApi('https://outof.cards/oauth/token/', requestString, {
			contentType: 'application/x-www-form-urlencoded',
		});
		if (!token) {
			return null;
		}

		const tokenWithExpiry: OutOfCardsToken = {
			...token,
			expires_timestamp: Date.now() + 1000 * token.expires_in,
		};
		return tokenWithExpiry;
	}

	private transformCollection(cards: Card[]): OocCollection {
		const collection = {};
		for (const card of cards ?? []) {
			const cardRef = this.allCards.getCard(card.id);
			if (!cardRef) {
				continue;
			}
			collection[cardRef.dbfId] = [card.count ?? 0, card.premiumCount ?? 0];
		}
		return {
			collection: collection,
		};
	}
}

export interface OutOfCardsToken {
	access_token: string;
	refresh_token: string;
	expires_in: number;
	expires_timestamp: number;
}

interface OocCollection {
	collection: {
		[dbfCardId: number]: readonly [number, number];
	};
}
