import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, RequestOptionsArgs } from "@angular/http";

import { LocalStorageService } from 'angular-2-local-storage';
// import * as Raven from 'raven-js';

import { Card } from '../../models/card';
import { CollectionManager } from './collection-manager.service';

declare var overwolf: any;

@Injectable()
export class HearthHeadSyncService {

	constructor(
		private http: Http,
		private localStorageService: LocalStorageService,
		private collectionManager: CollectionManager) {
	}

	public login(email: string, password: string, callback: Function) {
		let credentials = {
			"email": email,
			"password": password
		}
		let headers = new Headers({
		    'Content-Type': 'application/json',
		});
		let options = new RequestOptions({ headers: headers, withCredentials: true });

		this.http.post("https://auth.services.zam.com/v1/login", credentials, options)
			.subscribe(
				(data) => {
					console.log('login successful', data, data.headers.getAll('Set-Cookie'));
					let xsrfToken = data.headers.get('XSRF-TOKEN');
					this.localStorageService.set('hearthHeadXsrfToken', xsrfToken);
					callback();
				},
				(err) => {
					console.log('login error', err);
				}
			);
	}

	public sync(callback: Function) {
		this.collectionManager.getCollection((cards: Card[]) => {
			let collection = { };
			cards.forEach((card: Card) => {
				let jsonCard = collection[card.Id] || {
					"card_id": card.Id
				}
				if (card.Premium) {
					jsonCard.premium_count = card.Count
				}
				else {
					jsonCard.normal_count = card.Count
				}
				collection[card.Id] = jsonCard;
			})
			console.log('collection map', collection);

			let hearthheadCollection = {
				"cards": []
			}
			for (let key in collection) {
				hearthheadCollection.cards.push(collection[key]);
			}
			console.log('hearthhead collection', hearthheadCollection);
			this.postCollection(hearthheadCollection, callback);
		})
	}

	private postCollection(hearthheadCollection: any, callback: Function) {
		let headers = new Headers();
		// headers.append('XSRF-TOKEN', this.localStorageService.get('hearthHeadXsrfToken'));
		headers.append('X-XSRF-TOKEN', this.localStorageService.get('hearthHeadXsrfToken'));
		let options = new RequestOptions({ headers: headers });

		this.http.post("https://hearthstone.services.zam.com/v1/cardcollection", hearthheadCollection, options)
			.subscribe(
				(data) => {
					console.log('collection update successful', data);
					callback();
				},
				(err) => {
					console.log('issue with collection update', err);
				})
	}
}
