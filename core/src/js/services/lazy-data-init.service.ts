import { Injectable } from '@angular/core';
import { ConstructedMetaDecksStateBuilderService } from './decktracker/constructed-meta-decks-state-builder.service';

@Injectable()
export class LazyDataInitService {
	constructor(private readonly constructedMetaDecksStateBuilder: ConstructedMetaDecksStateBuilderService) {}

	public requestLoad(dataType: StateDataType) {
		console.debug('requesting load', dataType);
		switch (dataType) {
			case 'constructed-meta-decks':
				this.constructedMetaDecksStateBuilder.init();
		}
	}
}

export type StateDataType = 'constructed-meta-decks';
