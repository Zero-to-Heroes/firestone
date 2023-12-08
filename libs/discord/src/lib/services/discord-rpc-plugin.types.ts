export type DiscordRPCPlugin = {
	initialize: (applicationID: string, logLevel: LogLevel, callback: CallbackResponse) => void;
	onClientReady: Listener<OnClientReadyCallbackResponse>;
	onPresenceUpdate: Listener<SuccessCallbackResponse>;
	onClientError: Listener<ErrorCallbackResponse>;
	onLogLine: Listener<OnLogLineCallbackResponse>;
	updatePresence: (
		details: string,
		state: string,
		largeImageKey: string,
		largeImageText: string,
		smallImageKey: string,
		smallImageText: string,
		showTimestamps: boolean,
		endTime: number,
		button1Text: string,
		button1Url: string,
		button2Text: string | null,
		button2Url: string | null,
		callback: CallbackResponse,
	) => void;
	updatePresenceWithButtonsArray: (
		details: string,
		state: string,
		largeImageKey: string,
		largeImageText: string,
		smallImageKey: string,
		smallImageText: string,
		showTimestamps: boolean,
		endTime: number,
		buttonsJson: string,
		callback: CallbackResponse,
	) => void;
	dispose: (callback: CallbackResponse) => void;
};

type Listener<T> = {
	addListener: (callback: T) => void;
	removeListener: (callback: T) => void;
};
type SuccessResponse = {
	status: 'success';
	success: true;
};
type ErrorResponse = {
	status: 'error';
	success: false;
	error: string;
};
type OnClientReadyResponse = SuccessResponse & {
	user: User;
};
type OnLogLineResponse = {
	level: string;
	message: string;
};
type SuccessCallbackResponse = (response: SuccessResponse) => void;
type ErrorCallbackResponse = (response: ErrorResponse) => void;
type CallbackResponse = SuccessCallbackResponse | ErrorCallbackResponse;
type OnClientReadyCallbackResponse = (response: OnClientReadyResponse) => void;
type OnLogLineCallbackResponse = (response: OnLogLineResponse) => void;

export enum LogLevel {
	Trace = 1,
	Info = 2,
	Warning = 3,
	Error = 4,
	None = 0x100,
}

export type User = {
	id: number;
	username: string;
	discriminator: number;
	global_name: string;
	avatar: string;
	flags: Flag;
	premium_type: PremiumType;
	cdnEndpoint: string;
};

export enum Flag {
	None = 0x0,
	Employee = 0x1,
	Partner = 0x2,
	HypeSquad = 0x4,
	BugHunter = 0x8,
	HouseBravery = 0x40,
	HouseBrilliance = 0x80,
	HouseBalance = 0x100,
	EarlySupporter = 0x200,
	TeamUser = 0x400,
}

export enum PremiumType {
	None,
	NitroClassic,
	Nitro,
}
