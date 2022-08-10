import TheatreSettings from "../extensions/settings.js";
import Theatre from "../Theatre.js";

export default class TheatreSettingsInitializer {

    /**
         * @private
         */
    static getNameLocalizationKey(name: string): string {
        return "Theatre.UI.Settings" + "." + name;
    }

    /**
     * @private
     */
    static getHintLocalizationKey(name: string): string {
        return this.getNameLocalizationKey(name) + "Hint";
    }

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
            data.name = this.getNameLocalizationKey(key);
            data.hint = this.getHintLocalizationKey(key);
        }

        game.settings.register<string, string, T>(TheatreSettings.NAMESPACE, key, data);
    }

    /**
     * Init Module Settings
     */
    static initModuleSettings() {
        // module settings

        var debouncedReload = debounce(() => {
            window.location.reload()
        }, 100)

        this.register<boolean>(TheatreSettings.GM_ONLY, {
            scope: "world",
            config: true,
            default: false,
            type: Boolean,
            onChange: () => { if (!game.user.isGM) debouncedReload(); },
        });

        this.register<string>("theatreStyle", {
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

        this.register(TheatreSettings.THEATRE_IMAGE_SIZE, {
            scope: "client",
            config: true,
            default: 400,
            type: Number,
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
                "70%": "75%"
            },
            onChange: narrHeight => {
                Theatre.instance.settings.narrHeight = narrHeight;
                if (Theatre.instance.theatreNarrator)
                    Theatre.instance.theatreNarrator.style.top = `calc(${narrHeight} - 50px)`;
            }
        });

        this.register<number>("nameFontSize", {
            scope: "world",
            config: true,
            default: 44,
            type: Number,
            onChange: debouncedReload
        });

        this.register<number>("textDecayMin", {
            scope: "world",
            config: true,
            default: 30,
            type: Number,
            onChange: textDecayMin => {
                if (Theatre.DEBUG) console.log("Text decay minimum set to %s", textDecayMin);
                const textDecayMinValue = textDecayMin.toNearest();
                if (isNaN(textDecayMinValue) || textDecayMinValue <= 0) {
                    ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.InvalidDecayMin"));
                    TheatreSettings.set("textDecayMin", 30);
                    return;
                }
                if (textDecayMinValue > 600) {
                    ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayMin"));
                    TheatreSettings.set("textDecayMin", 600);
                    return;
                }

                Theatre.instance.settings.decayMin = textDecayMinValue * 1000;
            }
        });

        this.register<number>("textDecayRate", {
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
                    TheatreSettings.set("textDecayRate", 1);
                    return;
                }
                if (textDecayRateValue > 10) {
                    textDecayRateValue = 10;
                    ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.TooLongDecayRate"));
                    TheatreSettings.set("textDecayRate", 10);
                    return;
                }
                Theatre.instance.settings.decayRate = textDecayRateValue * 1000;
            }
        });

        this.register<number>("motdNewInfo", {
            scope: "client",
            default: 0,
            type: Number,
            onChange: () => { }
        });

        this.register<boolean>("autoHideBottom", {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: debouncedReload
        });

        this.register<boolean>("suppressMacroHotbar", {
            scope: 'world',
            config: true,
            type: Boolean,
            default: true,
            onChange: debouncedReload
        });

        this.register<boolean>(TheatreSettings.REMOVE_LABEL_SHEET_HEADER, {
            scope: 'world',
            config: true,
            type: Boolean,
            default: false,
            onChange: debouncedReload
        });

        this.register<number>(TheatreSettings.SUPPRESS_OPACITY, {
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

        this.register<boolean>(TheatreSettings.SHIFT_PAUSE_ICON, {
            scope: "world",
            config: true,
            type: Boolean,
            default: true,
            onChange: debouncedReload
        });
    }
}