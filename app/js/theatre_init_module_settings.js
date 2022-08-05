/**
 * Init Module Settings
 *
 * @private
 */

function _theatre_initModuleSettings() {
    // module settings

    game.settings.register("theatre", "gmOnly", {
        name: "Theatre.UI.Settings.gmOnly",
        hint: "Theatre.UI.Settings.gmOnlyHint",
        scope: "world",
        config: true,
        defualt: false,
        type: Boolean,
        onChange: () => { if (!game.user.isGM) location.reload(); },
    });

    game.settings.register("theatre", "theatreStyle", {
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

    game.settings.register("theatre", "theatreImageSize", {
        name: "Maximum image height",
        scope: "client",
        config: true,
        default: 400,
        type: Number,
    });

    game.settings.register("theatre", "theatreNarratorHeight", {
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
            this.settings.narrHeight = narrHeight;
            if (this.theatreNarrator)
                this.theatreNarrator.style.top = `calc(${narrHeight} - 50px)`;
        }
    });

    game.settings.register("theatre", "nameFont", {
        name: "Theatre.UI.Settings.nameFont",
        hint: "Theatre.UI.Settings.nameFontHint",
        scope: "world",
        config: true,
        default: Theatre.instance.titleFont,
        type: String,
        choices: Theatre.FONTS.reduce((a, font) => {
            a[font] = font;
            return a;
        }, {}),
    });

    game.settings.register("theatre", "nameFontSize", {
        name: "Theatre.UI.Settings.nameFontSize",
        hint: "Theatre.UI.Settings.nameFontSizeHint",
        scope: "world",
        config: true,
        default: 44,
        type: Number,
    });

    game.settings.register("theatre", "textDecayMin", {
        name: "Theatre.UI.Settings.textDecayMin",
        hint: "Theatre.UI.Settings.textDecayMinHint",
        scope: "world",
        config: true,
        default: 30,
        type: Number,
        onChange: textDecayMin => {
            if (Theatre.DEBUG) console.log("Text decay minimum set to %s", textDecayMin);
            textDecayMin = Number(textDecayMin);
            if (isNaN(textDecayMin) || textDecayMin <= 0) {
                ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayMin"));
                game.settings.set("theatre", "textDecayMin", 30);
                return;
            }
            if (textDecayMin > 600) {
                ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayMin"));
                game.settings.set("theatre", "textDecayMin", 600);
                return;
            }

            this.settings.decayMin = textDecayMin * 1000;
        }
    });

    game.settings.register("theatre", "textDecayRate", {
        name: "Theatre.UI.Settings.textDecayRate",
        hint: "Theatre.UI.Settings.textDecayRateHint",
        scope: "world",
        config: true,
        default: 1,
        type: Number,
        onChange: textDecayRate => {
            if (Theatre.DEBUG) console.log("Text decay rate set to %s", textDecayRate);
            textDecayRate = Number(textDecayRate);
            if (isNaN(textDecayRate) || textDecayRate <= 0) {
                textDecayRate = 1;
                ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayRate"));
                game.settings.set("theatre", "textDecayRate", 1);
                return;
            }
            if (textDecayRate > 10) {
                textDecayRate = 10;
                ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayRate"));
                game.settings.set("theatre", "textDecayRate", 10);
                return;
            }
            this.settings.decayRate = textDecayRate * 1000;
        }
    });

    game.settings.register("theatre", "motdNewInfo", {
        name: "MOTD New Info",
        scope: "client",
        default: 0,
        type: Number,
        onChange: newInfo => {
            // NOOP
        }
    });

    game.settings.register("theatre", "autoHideBottom", {
        name: "Theatre.UI.Settings.autoHideBottom",
        hint: "Theatre.UI.Settings.autoHideBottomHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("theatre", "suppressMacroHotbar", {
        name: "Theatre.UI.Settings.suppressMacroHotbar",
        hint: "",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("theatre", "removeLabelSheetHeader", {
        name: "Theatre.UI.Settings.removeLabelSheetHeader",
        hint: "Theatre.UI.Settings.removeLabelSheetHeaderHint",
        scope: "world",
        config: true,
        type: Boolean,
        default: false
    });

    game.settings.register("theatre", "suppressOpacity", {
        name: "Theatre.UI.Settings.suppressOpacity",
        hint: "Theatre.UI.Settings.suppressOpacityHint",
        scope: "world",
        config: true,
        default: 0.05,
        Range: {
            min: 0.0,
            max: 1.0
        },
        type: Number
    });
};

