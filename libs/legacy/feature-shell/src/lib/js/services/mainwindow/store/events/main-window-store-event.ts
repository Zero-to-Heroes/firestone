export interface MainWindowStoreEvent {
	isNavigationEvent(): boolean;
	eventName(): string;
}
