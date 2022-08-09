import Theatre from "./Theatre.js";


export default class _TheatreSettings {

	static REMOVE_LABEL_SHEET_HEADER = "removeLabelSheetHeader";

	static THEATRE = "theatre";
	static SUPPRESS_OPACITY = "suppressOpacity"
	static SHIFT_PAUSE_ICON = "shiftPauseIcon";

	static UI_SETTINGS_KEY = "Theatre.UI.Settings";
	static HINT = "Hint";

	/**
	 * Init Module Settings
	 */
	static initModuleSettings() {
		// module settings

		var debouncedReload = debounce(() => {
			window.location.reload()
		}, 100)

		game.settings.register<string, string, boolean>(this.THEATRE, "gmOnly", {
			name: "Theatre.UI.Settings.gmOnly",
			hint: "Theatre.UI.Settings.gmOnlyHint",
			scope: "world",
			config: true,
			default: false,
			type: Boolean,
			onChange: () => { if (!game.user.isGM) debouncedReload(); },
		});

		game.settings.register<string, string, string>(this.THEATRE, "theatreStyle", {
			name: "Theatre.UI.Settings.displayMode",
			hint: "Theatre.UI.Settings.displayModeHint",
			scope: "world",
			config: true,
			default: "textbox",
			type: String,
			choices: {
				"textbox": "Theatre.UI.Settings.displayModeTextBox",
				"lightbox": "Theatre.UI.Settings.displayModeLightBox",
				"clearbox": "Theatre.UI.Settings.displayModeClearBox"
			},
			onChange: theatreStyle => Theatre.instance.configTheatreStyle(theatreStyle)
		});

		game.settings.register<string, string, number>(this.THEATRE, "theatreImageSize", {
			name: "Maximum image height",
			scope: "client",
			config: true,
			default: 400,
			type: Number,
		});

		game.settings.register<string, string, string>(this.THEATRE, "theatreNarratorHeight", {
			name: "Theatre.UI.Settings.narrHeight",
			hint: "Theatre.UI.Settings.narrHeightHint",
			scope: "world",
			config: true,
			default: "50%",
			type: String,
			choices: {
				"15%": "15%",
				"25%": "25%",
				"30%": "30%",
				"50%": "50%",
				"70%": "75%"
			},
			onChange: narrHeight => {
				Theatre.instance.settings.narrHeight = narrHeight;
				if (Theatre.instance.theatreNarrator)
					Theatre.instance.theatreNarrator.style.top = `calc(${narrHeight} - 50px)`;
			}
		});

		game.settings.register<string, string, number>(this.THEATRE, "nameFontSize", {
			name: "Theatre.UI.Settings.nameFontSize",
			hint: "Theatre.UI.Settings.nameFontSizeHint",
			scope: "world",
			config: true,
			default: 44,
			type: Number,
			onChange: debouncedReload
		});

		game.settings.register<string, string, number>(this.THEATRE, "textDecayMin", {
			name: "Theatre.UI.Settings.textDecayMin",
			hint: "Theatre.UI.Settings.textDecayMinHint",
			scope: "world",
			config: true,
			default: 30,
			type: Number,
			onChange: textDecayMin => {
				if (Theatre.DEBUG) console.log("Text decay minimum set to %s", textDecayMin);
				const textDecayMinValue = textDecayMin.toNearest();
				if (isNaN(textDecayMinValue) || textDecayMinValue <= 0) {
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayMin"));
					game.settings.set(this.THEATRE, "textDecayMin", 30);
					return;
				}
				if (textDecayMinValue > 600) {
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayMin"));
					game.settings.set(this.THEATRE, "textDecayMin", 600);
					return;
				}

				Theatre.instance.settings.decayMin = textDecayMinValue * 1000;
			}
		});

		game.settings.register<string, string, number>(this.THEATRE, "textDecayRate", {
			name: "Theatre.UI.Settings.textDecayRate",
			hint: "Theatre.UI.Settings.textDecayRateHint",
			scope: "world",
			config: true,
			default: 1,
			type: Number,
			onChange: textDecayRate => {
				if (Theatre.DEBUG) console.log("Text decay rate set to %s", textDecayRate);
				let textDecayRateValue = textDecayRate.toNearest();
				if (isNaN(textDecayRateValue) || textDecayRateValue <= 0) {
					textDecayRateValue = 1;
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayRate"));
					game.settings.set(this.THEATRE, "textDecayRate", 1);
					return;
				}
				if (textDecayRateValue > 10) {
					textDecayRateValue = 10;
					ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayRate"));
					game.settings.set(this.THEATRE, "textDecayRate", 10);
					return;
				}
				Theatre.instance.settings.decayRate = textDecayRateValue * 1000;
			}
		});

		game.settings.register<string, string, number>(this.THEATRE, "motdNewInfo", {
			name: "MOTD New Info",
			scope: "client",
			default: 0,
			type: Number,
			onChange: () => { }
		});

		game.settings.register<string, string, boolean>(this.THEATRE, "autoHideBottom", {
			name: "Theatre.UI.Settings.autoHideBottom",
			hint: "Theatre.UI.Settings.autoHideBottomHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: debouncedReload
		});

		game.settings.register<string, string, boolean>(this.THEATRE, "suppressMacroHotbar", {
			name: "Theatre.UI.Settings.suppressMacroHotbar",
			hint: "",
			scope: 'world',
			config: true,
			type: Boolean,
			default: true,
			onChange: debouncedReload
		});

		game.settings.register(this.THEATRE, this.REMOVE_LABEL_SHEET_HEADER, {
			name: this.UI_SETTINGS_KEY + "." + this.REMOVE_LABEL_SHEET_HEADER,
			hint: this.UI_SETTINGS_KEY + "." + this.REMOVE_LABEL_SHEET_HEADER + this.HINT,
			scope: 'world',
			config: true,
			type: Boolean,
			default: false,
			onChange: debouncedReload
		});

		game.settings.register<string, string, number>(this.THEATRE, this.SUPPRESS_OPACITY, {
			name: "Theatre.UI.Settings.suppressOpacity",
			hint: "Theatre.UI.Settings.suppressOpacityHint",
			scope: "world",
			config: true,
			default: 0.05,
			type: Number,
			range: {
				min: 0.0,
				max: 1.0,
				step: 0.05
			},
			onChange: debouncedReload
		});

		game.settings.register<string, string, boolean>(this.THEATRE, this.SHIFT_PAUSE_ICON, {
			name: "Theatre.UI.Settings.shiftPauseIcon",
			hint: "Theatre.UI.Settings.shiftPauseIconHint",
			scope: "world",
			config: true,
			type: Boolean,
			default: true,
			onChange: debouncedReload
		});
	}
}
