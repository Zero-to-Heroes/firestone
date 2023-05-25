import { EventEmitter, Injectable, Optional } from '@angular/core';
import { ApiRunner, CardsFacadeService, OverwolfService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { Card } from '../../models/card';
import { CollectionManager } from '../collection/collection-manager.service';
import { Events } from '../events.service';
import { GameEventsEmitterService } from '../game-events-emitter.service';
import { OwNotificationsService } from '../notifications.service';
import { MemoryInspectionService } from '../plugins/memory-inspection.service';
import { PreferencesService } from '../preferences.service';

const COLLECTION_UPLOAD = `https://outof.cards/api/hearthstone/collection/import/`;

@Injectable()
export class OutOfCardsService {
	public stateUpdater = new EventEmitter<any>();

	constructor(
		private prefs: PreferencesService,
		private api: ApiRunner,
		private readonly i18n: LocalizationFacadeService,
		// These are not needed for generating tokens
		@Optional() private allCards: CardsFacadeService,
		@Optional() private memory: MemoryInspectionService,
		@Optional() private events: Events,
		@Optional() private ow: OverwolfService,
		@Optional() private gameEvents: GameEventsEmitterService,
		@Optional() private notifs: OwNotificationsService,
		@Optional() private collectionManager: CollectionManager,
	) {
		window['outOfCardsAuthUpdater'] = this.stateUpdater;
		this.stateUpdater.subscribe((token: OutOfCardsToken) => {
			console.log('[ooc-auth] received access token');
			this.handleToken(token);
		});

		this.initCollectionListener();
	}

	private async initCollectionListener() {
		if (this.collectionManager) {
			this.collectionManager.collection$$.subscribe((collection) => {
				this.uploadCollection(collection);
			});
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

	private async uploadCollection(collection: readonly Card[] = null) {
		const token: OutOfCardsToken = await this.getToken();
		if (!token) {
			return;
		}

		console.log('[ooc-auth] starting collection sync');
		// Read the memory, as if we can't access it we're not really interested in uploading a new version
		collection = collection ?? this.collectionManager?.collection$$.getValue();
		if (!collection?.length) {
			console.log('[ooc-auth] collection from memory is empty, not synchronizing it');
			return;
		}
		const oocCollection: OocCollection = this.transformCollection(collection);
		const result = await this.api.callPostApi(COLLECTION_UPLOAD, oocCollection, {
			bearerToken: token.access_token,
		});
		console.log('[ooc-auth] collection sync result', result);

		const prefs = await this.prefs.getPreferences();
		if (prefs.outOfCardsShowNotifOnSync) {
			const title = this.i18n.translateString('settings.general.third-party.ooc.title');
			const msg = this.i18n.translateString('settings.general.third-party.ooc.collection-synchronized');
			this.notifs.emitNewNotification({
				content: `
					<div class="general-message-container general-theme">
						<div class="firestone-icon">
							<svg class="svg-icon-fill">
								<use xlink:href="assets/svg/sprite.svg#ad_placeholder" />
							</svg>
						</div>
						<div class="message">
							<div class="title">
								<span>${title}</span>
							</div>
							<span class="text">${msg}</span>
						</div>
						<button class="i-30 close-button">
							<svg class="svg-icon-fill">
								<use xmlns:xlink="https://www.w3.org/1999/xlink" xlink:href="assets/svg/sprite.svg#window-control_close"></use>
							</svg>
						</button>
					</div>`,
				notificationId: `ooc-collection-synchronized`,
				timeout: 2000,
			});
		}
	}

	private async getToken(): Promise<OutOfCardsToken> {
		let token: OutOfCardsToken = (await this.prefs.getPreferences()).outOfCardsToken;
		if (token && Date.now() - token.expires_timestamp > 0) {
			if (token.refresh_token) {
				token = await this.refreshToken(token.refresh_token);
			}
		}
		await this.prefs.udpateOutOfCardsToken(token);
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

	private transformCollection(cards: readonly Card[]): OocCollection {
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

/* eslint-disable @typescript-eslint/naming-convention */
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
