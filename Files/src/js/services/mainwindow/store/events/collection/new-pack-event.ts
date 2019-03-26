import { MainWindowStoreEvent } from "../main-window-store-event";

export class NewPackEvent implements MainWindowStoreEvent {
	readonly setId: string;
	readonly packCards: ReadonlyArray<any>;

	constructor(setId: string, packCards: ReadonlyArray<any>) {
		this.setId = setId;
		this.packCards = packCards;
	}
}