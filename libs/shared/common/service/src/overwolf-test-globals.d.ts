/**
 * Jest runs in Node without the Overwolf SDK. `overwolf.service.ts` uses both the global value
 * and `overwolf.*` types; this minimal declaration satisfies the compiler for tests.
 * Same pattern as libs/game-state/src/overwolf-test-globals.d.ts.
 */
declare namespace overwolf {
	export type Dictionary<T = any> = any;

	export namespace games {
		export type GameInfoUpdatedEvent = any;
		export type GetRunningGameInfoResult = any;
		export type GetGameDBInfoResult = any;
		export type GetGameInfoResult = any;
	}

	export namespace windows {
		export type WindowIdResult = any;
		export interface WindowInfo {
			name: string;
			id: string;
			[key: string]: unknown;
		}
		export type WindowResult = any;
		export type DragResizeResult = any;
		export namespace enums {
			export type WindowDragEdge = any;
		}
	}

	export namespace extensions {
		export type GetManifestResult = any;
		export type GetInfoResult = any;
		export type GetRunningStateResult = any;
	}

	export namespace profile {
		export type GetCurrentUserResult = any;
		export namespace subscriptions {
			export type GetActivePlansResult = any;
			export type GetDetailedActivePlansResult = any;
			export type SubscriptionChangedEvent = any;
		}
	}

	export namespace io {
		export type DirResult = any;
	}

	export namespace os {
		export namespace tray {
			export type ExtensionTrayMenu = any;
			export type onMenuItemClickedEvent = any;
		}
	}

	export namespace utils {
		export interface SystemInfo {
			[key: string]: unknown;
		}
	}
}

declare const overwolf: any;
