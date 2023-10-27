import { EventEmitter, Injectable } from '@angular/core';
import { ApiRunner, CardsFacadeService } from '@firestone/shared/framework/core';
import { LocalizationFacadeService } from '@services/localization-facade.service';
import { combineLatest, filter, take } from 'rxjs';
import { Card } from '../../models/card';
import { CollectionManager } from '../collection/collection-manager.service';
import { GameStatusService } from '../game-status.service';
import { OwNotificationsService } from '../notifications.service';
import { PreferencesService } from '../preferences.service';
import { AppUiStoreFacadeService } from '../ui-store/app-ui-store-facade.service';

const COLLECTION_UPLOAD = `https://outof.games/api/hearthstone/collection/import/`;

@Injectable()
export class OutOfCardsService {
	public stateUpdater = new EventEmitter<any>();

	constructor(
		private prefs: PreferencesService,
		private api: ApiRunner,
		private readonly i18n: LocalizationFacadeService,
		// These are not needed for generating tokens
		private allCards: CardsFacadeService,
		private notifs: OwNotificationsService,
		private collectionManager: CollectionManager,
		private readonly store: AppUiStoreFacadeService,
		private readonly gameStatus: GameStatusService,
	) {
		window['outOfCardsAuthUpdater'] = this.stateUpdater;
		this.init();
	}

	private init() {
		combineLatest([this.gameStatus.inGame$$, this.store.listenPrefs$((prefs) => prefs.outOfCardsToken)])
			.pipe(
				filter(([inGame, [token]]) => inGame && !!token?.access_token?.length),
				take(1),
			)
			.subscribe(() => {
				this.initCollectionListener();
			});
		this.stateUpdater.subscribe((token: OutOfCardsToken) => {
			console.log('[ooc-auth] received access token');
			this.handleToken(token);
		});
	}

	private async initCollectionListener() {
		this.collectionManager.collection$$.subscribe((collection) => {
			this.uploadCollection(collection);
		});
		console.log('[ooc-auth] handler init done');
	}

	private async handleToken(token: OutOfCardsToken) {
		await this.prefs.udpateOutOfCardsToken(token);
	}

	private async uploadCollection(collection: readonly Card[]) {
		const token: OutOfCardsToken = await this.getToken();
		if (!token) {
			return;
		}

		console.log('[ooc-auth] starting collection sync');
		// Read the memory, as if we can't access it we're not really interested in uploading a new version
		collection = await this.collectionManager?.collection$$.getValueWithInit();
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
		const token: OutOfCardsToken = await this.api.callPostApi('https://outof.games/oauth/token/', requestString, {
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
