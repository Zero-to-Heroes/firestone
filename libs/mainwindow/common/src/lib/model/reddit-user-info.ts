import { SocialUserInfo } from './social-user-info';

export class RedditUserInfo implements SocialUserInfo {
	readonly network = 'reddit';
	readonly avatarUrl: string;
	readonly id: string;
	readonly name: string;
	readonly screenName: string;
}
