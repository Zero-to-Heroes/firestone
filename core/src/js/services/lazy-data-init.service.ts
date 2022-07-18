import { Injectable } from '@angular/core';
import { BgsInitService } from './battlegrounds/bgs-init.service';
import { ConstructedMetaDecksStateBuilderService } from './decktracker/constructed-meta-decks-state-builder.service';
import { MercenariesStateBuilderService } from './mercenaries/mercenaries-state-builder.service';

@Injectable()
export class LazyDataInitService {
	constructor(
		private readonly constructedMetaDecksStateBuilder: ConstructedMetaDecksStateBuilderService,
		private readonly mercenariesStateBuilder: MercenariesStateBuilderService,
		private readonly bgsPerfectGamesStateBuilder: BgsInitService,
	) {}

	public requestLoad(dataType: StateDataType) {
		console.debug('requesting load', dataType);
		switch (dataType) {
			case 'constructed-meta-decks':
				return this.constructedMetaDecksStateBuilder.loadInitialStats();
			case 'mercenaries-global-stats':
				return this.mercenariesStateBuilder.loadInitialGlobalStats();
			case 'mercenaries-reference-data':
				return this.mercenariesStateBuilder.loadInitialReferenceData();
			case 'battlegrounds-perfect-games':
				return this.bgsPerfectGamesStateBuilder.loadInitialPerfectGames();
		}
	}
}

export type StateDataType =
	| 'constructed-meta-decks'
	| 'mercenaries-global-stats'
	| 'mercenaries-reference-data'
	| 'battlegrounds-perfect-games';
