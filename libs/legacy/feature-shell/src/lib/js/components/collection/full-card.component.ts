import {
	AfterContentInit,
	ChangeDetectionStrategy,
	ChangeDetectorRef,
	Component,
	EventEmitter,
	Input,
	Output,
	ViewRef,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ReferenceCard, ReferenceCardAudio } from '@firestone-hs/reference-data';
import { CardsFacadeService } from '@services/cards-facade.service';
import { getHeroFaction } from '@services/mercenaries/mercenaries-utils';
import { BehaviorSubject, combineLatest } from 'rxjs';
import { SetCard } from '../../models/set';
import { SetsService } from '../../services/collection/sets-service.service';
import { formatClass } from '../../services/hs-utils';
import { LocalizationFacadeService } from '../../services/localization-facade.service';
import { AppUiStoreFacadeService } from '../../services/ui-store/app-ui-store-facade.service';
import { capitalizeEachWord, pickRandom } from '../../services/utils';
import { AbstractSubscriptionComponent } from '../abstract-subscription.component';

declare let amplitude;

@Component({
	selector: 'full-card',
	styleUrls: [`../../../css/component/collection/full-card.component.scss`],
	template: `
		<div
			class="card-details-container"
			[ngClass]="{ owned: card.owned, missing: !card.owned, hero: isHero }"
			*ngIf="card"
		>
			<div class="card-view-container">
				<card-view
					[card]="card"
					[tooltips]="false"
					[showCounts]="showCount"
					[premium]="!!card.ownedPremium"
					[highRes]="true"
					>/</card-view
				>
			</div>
			<div class="details" scrollable>
				<h1>{{ card.name }}</h1>
				<div class="card-details">
					<div class="card-info class" *ngIf="class">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.class'"></span>
						<span class="value">{{ class }}</span>
					</div>
					<div class="card-info type">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.type'"></span>
						<span class="value">{{ type }}</span>
					</div>
					<div class="card-info set" *ngIf="set">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.set'"></span>
						<span class="value">{{ set }}</span>
					</div>
					<div class="card-info rarity" *ngIf="rarity">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.rarity'"></span>
						<span class="value">{{ rarity }}</span>
					</div>
					<div class="card-info race" *ngIf="race">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.race'"></span>
						<span class="value">{{ race }}</span>
					</div>
					<div class="card-info faction" *ngIf="faction">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.faction'"></span>
						<span class="value">{{ faction }}</span>
					</div>
					<div class="card-info flavor-text" *ngIf="flavor">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.flavor'"></span>
						<p class="value" [innerHTML]="flavor"></p>
					</div>
					<div class="card-info audio" *ngIf="audioClips && audioClips.length > 0">
						<span class="sub-title" [owTranslate]="'app.collection.card-details.sounds-title'"></span>
						<div class="audio-category" *ngFor="let category of audioCategories">
							<span class="audio-category-title">{{ category.name }}</span>
							<li class="sound" *ngFor="let sound of category.clips" (mousedown)="playSound(sound)">
								<button class="i-30 brown-theme sound-button">
									<svg class="svg-icon-fill">
										<use xlink:href="assets/svg/sprite.svg#sound" />
									</svg>
								</button>
								<span class="label">{{ sound.name }}</span>
							</li>
						</div>
					</div>
				</div>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FullCardComponent extends AbstractSubscriptionComponent implements AfterContentInit {
	// eslint-disable-next-line @angular-eslint/no-output-native
	@Output() close = new EventEmitter();

	class: string;
	type: string;
	set: string;
	rarity: string;
	card: InternalReferenceCard;
	showCount: boolean;
	flavor: SafeHtml;
	race: string;
	faction: string;
	isHero: boolean;

	audioCategories: readonly AudioClipCategory[];
	audioClips: readonly AudioClip[];

	// Soi we can cancel a playing sound if a new card is displayed
	private previousClips: readonly AudioClip[] = [];

	private selectedCard$$ = new BehaviorSubject<SetCard | ReferenceCard>(null);

	@Input() set selectedCard(selectedCard: SetCard | ReferenceCard) {
		if (!selectedCard) {
			return;
		}

		this.selectedCard$$.next(selectedCard);
	}

	constructor(
		protected readonly store: AppUiStoreFacadeService,
		protected readonly cdr: ChangeDetectorRef,
		private readonly i18n: LocalizationFacadeService,
		private readonly cards: SetsService,
		private readonly allCards: CardsFacadeService,
		private readonly sanitizer: DomSanitizer,
	) {
		super(store, cdr);
	}

	ngAfterContentInit() {
		combineLatest(
			this.selectedCard$$.asObservable(),
			this.listenForBasicPref$((prefs) => prefs.locale),
		)
			.pipe(this.mapData(([selectedCard, locale]) => ({ selectedCard, locale })))
			.subscribe((info) => {
				const selectedCard = info.selectedCard;
				const locale = info.locale;
				this.previousClips = this.audioClips || [];
				this.audioCategories = this.buildAudio(selectedCard, locale);
				this.audioClips = this.audioCategories
					.map((cat: AudioClipCategory) => cat.clips)
					.reduce((a, b) => a.concat(b), []);

				const card = this.cards.getCard(selectedCard.id);
				// Because the high res images we have for the heroes are a bit weird
				this.isHero = card.type === 'Hero';
				this.card = SetCard.create({
					id: card.id,
					cardClass: card.cardClass?.toLowerCase(),
					collectible: card.collectible,
					cost: card.cost,
					name: card.name,
					ownedDiamond: (selectedCard as SetCard).ownedDiamond,
					ownedSignature: (selectedCard as SetCard).ownedSignature,
					ownedNonPremium: (selectedCard as SetCard).ownedNonPremium,
					ownedPremium: (selectedCard as SetCard).ownedPremium,
				});
				if (
					this.card.ownedNonPremium ||
					this.card.ownedPremium ||
					this.card.ownedDiamond ||
					this.card.ownedSignature
				) {
					this.showCount = true;
				} else {
					this.showCount = false;
				}
				this.card.owned =
					!!this.card.ownedPremium ||
					!!this.card.ownedNonPremium ||
					!!this.card.ownedDiamond ||
					!!this.card.ownedSignature;
				this.class = card.classes?.length
					? card.classes.map((playerClass) => formatClass(playerClass, this.i18n)).join(', ')
					: card.playerClass != null
					? formatClass(card.playerClass, this.i18n)
					: null;

				this.type = this.i18n.translateString(`app.collection.card-details.types.${card.type?.toLowerCase()}`);
				this.set = this.i18n.translateString(`global.set.${card.set?.toLowerCase()}`);
				this.rarity =
					card.rarity != null
						? this.i18n.translateString(
								`app.collection.card-details.rarities.${card.rarity?.toLowerCase()}`,
						  )
						: null;
				this.race = !card.races?.length
					? card.races
							.map((race) => this.i18n.translateString(`global.tribe.${race.toLowerCase()}`))
							.join(', ')
					: null;
				this.faction = card.mercenary
					? this.i18n.translateString(`app.collection.card-details.factions.${getHeroFaction(card.races[0])}`)
					: null;
				const flavorSource = card.flavor ?? card.text;
				this.flavor = flavorSource?.length
					? this.sanitizer.bypassSecurityTrustHtml(this.transformFlavor(flavorSource))
					: null;
				if (!(this.cdr as ViewRef)?.destroyed) {
					this.cdr.detectChanges();
				}
			});
	}

	playSound(audioClip: AudioClip) {
		amplitude.getInstance().logEvent('sound', {
			'card-id': this.card.id,
		});
		this.cancelPlayingSounds();

		const audioGroup = audioClip.audioGroup;

		const mainFiles = Object.values(audioGroup)
			.flatMap((effect) => effect.mainSounds)
			.filter((sound) => !!sound);
		const randomSounds =
			Object.values(audioGroup)
				.filter((effect) => !!effect.randomSounds?.length)
				.map((effect) => pickRandom(effect.randomSounds).sound)
				.filter((sound) => sound) ?? [];
		const allSoundsToPlay = [...mainFiles, ...randomSounds];
		audioClip.audios
			.filter((audio) => allSoundsToPlay.includes((audio as any).key))
			.forEach((audio) => {
				audio.play();
			});
	}

	closeWindow() {
		this.close.emit(null);
	}

	private buildAudio(inputCard: ReferenceCard | SetCard, locale: string): readonly AudioClipCategory[] {
		const card = this.allCards.getCard(inputCard.id);
		if (!(card as ReferenceCard).audio2) {
			return [];
		}

		const result = [
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.basic'),
				clips: this.buildAudioClips(card.audio2, 'basic', locale),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.spell'),
				clips: this.buildAudioClips(card.audio2, 'spell', locale),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.emote'),
				clips: this.buildAudioClips(card.audio2, 'emote', locale),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.event'),
				clips: this.buildAudioClips(card.audio2, 'event', locale),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.error'),
				clips: this.buildAudioClips(card.audio2, 'error', locale),
			},
			{
				name: this.i18n.translateString('app.collection.card-details.sounds.category.disabled'),
				clips: this.buildAudioClips(card.audio2, 'disabled', locale),
			},
		];
		const allMappedClips = result
			.map((cat) => cat.clips)
			.reduce((a, b) => a.concat(b), [])
			.map((clip) => clip.originalKey);
		const otherAudio = { ...card.audio2 };
		allMappedClips.forEach((key) => delete otherAudio[key]);
		const otherCategory = {
			name: this.i18n.translateString('app.collection.card-details.sounds.category.other'),
			clips: this.buildAudioClips(otherAudio, null, locale),
		};

		return [...result, otherCategory].filter((cat) => cat.clips.length > 0);
	}

	private buildAudioClips(
		audio: ReferenceCardAudio,
		category: 'basic' | 'spell' | 'emote' | 'event' | 'error' | 'disabled' | null,
		locale: string,
	): readonly AudioClip[] {
		return Object.keys(audio)
			.filter((key) => !category || this.REGEXES.find((regex) => key.match(regex.regex))?.category === category)
			.map((key) => {
				const audioGroup = audio[key];
				const mainFiles = Object.values(audioGroup).flatMap((effect) => effect.mainSounds);
				const allRandomFiles =
					Object.values(audioGroup)
						.filter((effect) => !!effect.randomSounds?.length)
						.flatMap((effect) => effect.randomSounds)
						.map((sound) => sound.sound) ?? [];
				const files = [...mainFiles, ...allRandomFiles];
				const audioClip: AudioClip = {
					name: this.getSoundName(key),
					originalKey: key,
					audioGroup: audioGroup,
					audios: files.flatMap((file) =>
						// We don't know beforehand if the file is localized or not, so we try to load both versions
						[
							this.createAudio(
								file,
								`https://static.zerotoheroes.com/hearthstone/audio/sounds/common/${file}`,
							),
							this.createAudio(
								file,
								`https://static.zerotoheroes.com/hearthstone/audio/sounds/${locale}/${file}`,
							),
						],
					),
				};
				audioClip.audios.forEach((audio) => audio.load());
				return audioClip;
			})
			.filter((audio) => audio.name);
	}

	private getSoundName(key: string): string {
		if (!key) {
			return null;
		}
		for (const regex of this.REGEXES) {
			if (key.match(regex.regex)) {
				return regex.value;
			}
		}
		return key
			? capitalizeEachWord(
					key
						.replace(/SPELL/gi, '')
						.replace(/VO_(STORY_)?HERO(_\d+[A-Z]*)?/gi, '')
						.replace(/VO_([A-Z]+_?\d+)?/gi, '')
						.replace(/FEMALE_[A-Z-]+_/gi, '')
						.replace(/MALE_[A-Z-]+_/gi, '')
						.replace(/_/g, ' ')
						.trim(),
			  )
			: '';
	}

	// The order is important, as the first match is always returned
	private readonly REGEXES = [
		{
			regex: /.*BASIC_PLAY.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.play'),
			category: 'basic',
		},
		{
			regex: /.*BASIC_DEATH.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.death'),
			category: 'basic',
		},
		{
			regex: /.*BASIC_ATTACK.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.attack'),
			category: 'basic',
		},
		{
			regex: /.*PICKED.*|VO_HERO_09_Male_Human_Emote_(06|07)|VO_HERO_03_Female_BloodElf_Emote_(05|10)|VO_HERO_01_Male_Orc_Emote_01/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.picked'),
			category: 'basic',
		},

		{
			regex: /.*WINTERVEIL_GREETINGS.*|.*HAPPY_HOLIDAYS.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.winterveil-greetings'),
			category: 'event',
		},
		{
			regex: /.*LUNAR_NEW_YEAR.*|.*HAPPY_NEW_YEAR_LUNAR.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.lunar-new-year'),
			category: 'event',
		},
		{
			regex: /.*HAPPY_NEW_YEAR.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.happy-new-year'),
			category: 'event',
		},
		{
			regex: /.*FIRE_FESTIVAL.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.fire-festival'),
			category: 'event',
		},
		{
			regex: /.*PIRATE_DAY.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.pirate-day'),
			category: 'event',
		},
		{
			regex: /.*HALLOWS_END.*|.*HAPPY_HALLOWEEN.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.hallows-end'),
			category: 'event',
		},
		{
			regex: /.*NOBLEGARDEN.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.noblegarden'),
			category: 'event',
		},
		{
			regex: /.*HOLIDAY.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.holiday'),
			category: 'event',
		},

		{
			regex: /.*GREETINGS_DISABLED.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.greetings'),
			category: 'disabled',
		},
		{
			regex: /.*WELL_PLAYED_DISABLED.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.well-played'),
			category: 'disabled',
		},
		{
			regex: /.*THANKS_DISABLED.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.thanks'),
			category: 'disabled',
		},
		{
			regex: /.*THREATEN_DISABLED.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.threaten'),
			category: 'disabled',
		},
		{
			regex: /.*OOPS_DISABLED.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.oops'),
			category: 'disabled',
		},

		{
			regex: /.*START_?MIRROR.*|.*MIRROR_?START.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.start-mirror'),
			category: 'emote',
		},
		{
			regex: /.*GREETINGS_?MIRROR.*|.*MIRROR_?GREETINGS.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.greetings-mirror'),
			category: 'emote',
		},
		{
			regex: /.*GREETINGS_?RESPONSE.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.greetings-response'),
			category: 'emote',
		},
		{
			regex: /.*GREETINGS.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.greetings'),
			category: 'emote',
		},

		{
			regex: /.*WELL_?PLAYED.*|VO_HERO_03_Female_BloodElf_Emote_04/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.well-played'),
			category: 'emote',
		},
		{
			regex: /.*OOPS.*|VO_HERO_03_Female_BloodElf_Emote_07/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.oops'),
			category: 'emote',
		},
		{
			regex: /.*THREATEN.*|VO_HERO_09_Male_Human_Emote_03|VO_HERO_03_Female_BloodElf_Emote_08|VO_HERO_01_Male_Orc_Emote_10/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.threaten'),
			category: 'emote',
		},
		{
			regex: /.*THANKS.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.thanks'),
			category: 'emote',
		},
		{
			regex: /.*SORRY.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.sorry'),
			category: 'emote',
		},
		{
			regex: /.*WOW.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.wow'),
			category: 'emote',
		},
		{
			regex: /.*CONCEDE.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.concede'),
			category: 'emote',
		},
		{
			regex: /.*START.*|VO_HERO_09_Male_Human_Emote_10|VO_HERO_03_Female_BloodElf_Emote_01|VO_HERO_01_Male_Orc_Emote_12/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.start'),
			category: 'emote',
		},
		{
			regex: /.*TIMER?.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.timer'),
			category: 'emote',
		},
		{
			regex: /.*THINK(?:ING)?.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.think'),
			category: 'emote',
		},
		{
			regex: /.*LOW_?CARDS.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.low-cards'),
			category: 'emote',
		},
		{
			regex: /.*NO_?CARDS.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.no-cards'),
			category: 'emote',
		},
		{
			regex: /.*WON.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.won'),
			category: 'emote',
		},
		{
			regex: /.*IDLE.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.idle'),
			category: 'emote',
		},

		{
			regex: /.*ERROR_01.*|.*ERROR_NEED_WEAPON.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-need-weapon'),
			category: 'error',
		},
		{
			regex: /.*ERROR_02.*|.*ERROR_NEED_MANA.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-need-mana'),
			category: 'error',
		},
		{
			regex: /.*ERROR_03.*|.*ERROR_MINION_ATTACKED.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-minion-attacked'),
			category: 'error',
		},
		{
			regex: /.*ERROR_04.*|.*ERROR_I_ATTACKED.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-i-attacked'),
			category: 'error',
		},
		{
			regex: /.*ERROR_05.*|.*ERROR_JUST_PLAYED.*|.*SUMMON_SICKNESS.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-just-played'),
			category: 'error',
		},
		{
			regex: /.*ERROR_06.*|.*ERROR_HAND_FULL.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-hand-full'),
			category: 'error',
		},
		{
			regex: /.*ERROR_07.*|.*ERROR_FULL_MINIONS.*|.*ERRORSPACE.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-full-minions'),
			category: 'error',
		},
		{
			regex: /.*ERROR_08.*|.*ERROR_STEALTH.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-stealth'),
			category: 'error',
		},
		{
			regex: /.*ERROR_09.*|.*ERROR_PLAY.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-play'),
			category: 'error',
		},
		{
			regex: /.*ERROR_10.*|.*ERROR_TARGET.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-target'),
			category: 'error',
		},
		{
			regex: /.*ERROR_11.*|.*ERROR_TAUNT.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-taunt'),
			category: 'error',
		},
		{
			regex: /.*ERROR_12.*|.*ERROR_GENERIC.*/gi,
			value: this.i18n.translateString('app.collection.card-details.sounds.effect.error-generic'),
			category: 'error',
		},
	];

	private cancelPlayingSounds() {
		this.previousClips.forEach((sound) => {
			sound.audios.forEach((audio) => {
				audio.pause();
				audio.currentTime = 0;
			});
		});
		this.audioClips.forEach((sound) => {
			sound.audios.forEach((audio) => {
				audio.pause();
				audio.currentTime = 0;
			});
		});
	}

	private createAudio(key: string, src: string): any {
		const audio = new Audio();
		audio.src = src;
		(audio as any).key = key;
		return audio;
	}

	private transformFlavor(flavor: string): string {
		const result = flavor
			.replace(/\n/g, '<br>')
			.replace(/<i>/g, '')
			.replace(/<\/i>/g, '')
			.replace(/<br>/g, ' ')
			.replace(/[x]/g, '');
		return result;
	}
}

interface AudioClipCategory {
	name: string;
	clips: readonly AudioClip[];
}

interface AudioClip {
	name: string;
	originalKey: string;
	audioGroup: ReferenceCardAudio[0];
	audios: HTMLAudioElement[];
}

interface InternalReferenceCard extends SetCard {
	owned?: boolean;
}
