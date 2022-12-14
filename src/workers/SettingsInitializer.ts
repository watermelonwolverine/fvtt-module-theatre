import TheatreSettings from "../extensions/TheatreSettings";
import Theatre from "../Theatre";
import TheatreStyle, { AnyTheatreStyle } from "../types/TheatreStyle";

export default class TheatreSettingsInitializer {
	/**
	 * @private
	 */
	static register<T>(
		key: string,
		data: ClientSettings.Values[`${string}.${string}`] extends string | number | boolean | Array<any> | object
			? ClientSettings.PartialSettingConfig<ClientSettings.Values[`${string}.${string}`]>
			: ClientSettings.PartialSettingConfig<T>
	): void {
		if (data.config) {
			data.name = TheatreSettings.getNameLocalizationKey(key);
			data.hint = TheatreSettings.getHintLocalizationKey(key);
		}

		game.settings.register<string, string, T>(TheatreSettings.NAMESPACE, key, data);
	}

	/**
	 * Init Module Settings
	 */
	static initModuleSettings() {
		// module settings

		var debouncedReload = debounce(() => {
			window.location.reload();
		}, 100);

		this.register<boolean>(TheatreSettings.GM_ONLY, {
			scope: "world",
			config: true,
			default: false,
			type: Boolean,
			onChange: () => {
				if (!game.user?.isGM) debouncedReload();
			},
		});

		const choices: { [key: string]: string } = {};

		choices[TheatreStyle.TEXTBOX] = "Theatre.UI.Settings.displayModeTextBox";
		choices[TheatreStyle.LIGHTBOX] = "Theatre.UI.Settings.displayModeLightBox";
		choices[TheatreStyle.CLEARBOX] = "Theatre.UI.Settings.displayModeClearBox";

		this.register<string>(TheatreSettings.THEATRE_STYLE, {
			scope: "world",
			config: true,
			default: TheatreStyle.TEXTBOX,
			type: String,
			choices: choices,
			onChange: (theatreStyle) => Theatre.instance.configTheatreStyle(theatreStyle as AnyTheatreStyle),
		});

		this.register(TheatreSettings.THEATRE_IMAGE_SIZE, {
			scope: "client",
			config: true,
			default: TheatreSettings.THEATRE_IMAGE_SIZE_DEFAULT.toString(),
			type: String,
			onChange: () => Theatre.instance.stage.updatePortraits(),
		});

		this.register<string>(TheatreSettings.NARRATOR_HEIGHT, {
			scope: "world",
			config: true,
			default: "50%",
			type: String,
			choices: {
				"15%": "15%",
				"25%": "25%",
				"30%": "30%",
				"50%": "50%",
				"70%": "75%",
			},
			onChange: () => Theatre.instance.maybeUpdateNarratorHeight(),
		});

		this.register<number>("nameFontSize", {
			scope: "world",
			config: true,
			default: 44,
			type: Number,
			onChange: debouncedReload,
		});

		this.register<number>(TheatreSettings.TEXT_DECAY_MIN, {
			scope: "world",
			config: true,
			default: 30,
			type: Number,
			onChange: (textDecayMin) => {
				const textDecayMinValue = textDecayMin.toNearest();
				if (isNaN(textDecayMinValue) || textDecayMinValue <= 0) {
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayMin"));
					TheatreSettings.set(TheatreSettings.TEXT_DECAY_MIN, 30);
					return;
				}
				if (textDecayMinValue > 600) {
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayMin"));
					TheatreSettings.set(TheatreSettings.TEXT_DECAY_MIN, 600);
					return;
				}
			},
		});

		this.register<number>(TheatreSettings.TEXT_DECAY_RATE, {
			scope: "world",
			config: true,
			default: 1,
			type: Number,
			onChange: (textDecayRate) => {
				let textDecayRateValue = textDecayRate.toNearest();
				if (isNaN(textDecayRateValue) || textDecayRateValue <= 0) {
					textDecayRateValue = 1;
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayRate"));
					TheatreSettings.set(TheatreSettings.TEXT_DECAY_RATE, 1);
					return;
				}
				if (textDecayRateValue > 10) {
					textDecayRateValue = 10;
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayRate"));
					TheatreSettings.set(TheatreSettings.TEXT_DECAY_RATE, 10);
					return;
				}
			},
		});

		this.register<number>("motdNewInfo", {
			scope: "client",
			default: 0,
			type: Number,
			onChange: () => {},
		});

		this.register<boolean>("autoHideBottom", {
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: debouncedReload,
		});

		this.register<boolean>("suppressMacroHotbar", {
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: debouncedReload,
		});

		this.register<boolean>(TheatreSettings.REMOVE_LABEL_SHEET_HEADER, {
			scope: "world",
			config: true,
			type: Boolean,
			default: false,
			onChange: debouncedReload,
		});

		this.register<number>(TheatreSettings.SUPPRESS_OPACITY, {
			scope: "world",
			config: true,
			default: 0.05,
			type: Number,
			range: {
				min: 0.0,
				max: 1.0,
				step: 0.05,
			},
			onChange: debouncedReload,
		});

		this.register<boolean>(TheatreSettings.SHIFT_PAUSE_ICON, {
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: debouncedReload,
		});
	}
}
