export interface MainWindowStoreEvent {
	eventName(): string;
	isNavigationEvent(): boolean;
}
