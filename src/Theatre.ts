/**
 * Theatre.js
 *
 * Copyright (c) 2019 Ken L.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>. 
 *
 */

import EmoteMenuInitilializer from './components/controls/emoteMenu/EmoteMenuRenderer';
import NavBar from './components/controls/NavBar';
import TheatreControls from './components/controls/TheatreControls';
import Portrait from './components/stage/Portrait';
import Stage from './components/stage/Stage';
import StageInsert from './components/stage/StageInsert';
import ToolTipCanvas from './components/ToolTipCanvas';
import ActorExtensions from './extensions/ActorExtensions';
import TheatreSettings from './extensions/TheatreSettings';
import { RiggingResource } from './resources/resources_types';
import EmotionDefinition from "./types/EmotionDefinition";
import Params from './types/Params';
import ResyncData, { InsertData } from './types/ResyncData';
import { AnyResyncType } from './types/ResyncType';
import { SceneEventTypes } from "./types/SceneEventTypes";
import TheatreActorConfig from './types/TheatreActorConfig';
import TheatreStyle, { AnyTheatreStyle } from './types/TheatreStyle';
import TypingEvent from './types/TypginEvent';
import User from './types/User';
import { AnimationSyntaxVerifier } from './workers/AnimationSyntaxVerifier';
import EaseVerifier from './workers/EaseVerifier';
import EmoteSetter from './workers/EmoteSetter';
import InsertReorderer from './workers/InsertReorderer';
import KHelpers from "./workers/KHelpers";
import SceneEventProcessor from './workers/SceneEventProcessor';
import TheatreSettingsInitializer from './workers/SettingsInitializer';
import TextBoxFactory from './workers/textbox_factory';
import Tools from "./workers/Tools";
import _TheatreWorkers from './workers/workers';

export type SomeCallBack = (loader: PIXI.Loader, resources: PIXI.IResourceDictionary) => void;

export type ImageSource = { imgpath: string, resname: string };

export default class Theatre {

	static SOCKET = "module.theatre";
	static NARRATOR = "Narrator";
	static ICONLIB = "modules/theatre/app/graphics/emotes";
	static DEBUG = false;
	static instance: Theatre = undefined;

	workers: _TheatreWorkers;
	textFont: string;
	fontWeight: string;
	currentTheatreStyle: any;
	reorderTOId: any;
	dragNavItem: any;
	isNarratorActive: boolean;
	isSuppressed: boolean;
	isQuoteAuto: boolean;
	isDelayEmote: boolean;
	delayedSentState: number;
	rendering: boolean;
	renderAnims: number;
	speakingAs: any;
	userEmotes: Map<string, EmotionDefinition>;
	usersTyping: Map<string, User>;
	userSettings: {};
	lastTyping: number;
	resync: { type: AnyResyncType; timeoutId: any; };
	stage: Stage;
	navBar: NavBar;
	toolTipCanvas: ToolTipCanvas;
	theatreControls: TheatreControls;
	emoteMenuRenderer: EmoteMenuInitilializer;
	insertReorderer: InsertReorderer;
	emoteSetter: EmoteSetter;
	sceneEventProcessor: SceneEventProcessor;
	textBoxFactory: TextBoxFactory;
	theatreGroup: HTMLDivElement;
	theatreNarrator: HTMLDivElement;
	theatreBar: any;
	offsetHeight: any;
	label: any;

	/**
	 * Make singleton and initalize the inner instance object. 
	 * Return singleton if already created. 
	 */
	constructor() {
		if (!Theatre.instance) {
			// build theater-wide statics

			Theatre.instance = this;

			this.workers = new _TheatreWorkers(this);

			// build theater variables
			// font related
			this.textFont = "SignikaBold";
			this.fontWeight = "bold";
			// position/order related
			this.currentTheatreStyle = undefined;
			this.reorderTOId = null;
			this.dragNavItem = null;
			// toggle related
			this.isNarratorActive = false;
			this.isSuppressed = false;
			this.isQuoteAuto = false;
			this.isDelayEmote = false;
			this.delayedSentState = 0;
			// render related
			this.rendering = false;
			this.renderAnims = 0;
			this.speakingAs = null;


			this.userEmotes = new Map();
			this.usersTyping = new Map();
			this.userSettings = {};
			this.lastTyping = 0;
			this.resync = {
				type: "any",
				timeoutId: null
			};

			// Components
			this.stage = new Stage(this);

			this.navBar = new NavBar(
				this,
				this.stage);

			this.toolTipCanvas = new ToolTipCanvas(this.stage);

			this.theatreControls = new TheatreControls(
				this,
				this.stage);

			// workers
			this.emoteMenuRenderer = new EmoteMenuInitilializer(
				this,
				this.toolTipCanvas);

			this.insertReorderer = new InsertReorderer(
				this,
				this.stage);

			this.emoteSetter = new EmoteSetter(this);

			this.sceneEventProcessor = new SceneEventProcessor(
				this,
				this.stage);

			this.textBoxFactory = new TextBoxFactory(
				this,
				this.sceneEventProcessor);

			TheatreSettingsInitializer.initModuleSettings();

		}
		return Theatre.instance;
	}

	initialize() {
		// inject HTML
		this._injectHTML();
		// socket 
		this._initSocket();
		// global listeners
		window.addEventListener("resize", ev => this.updateGeometry());
		// request a resync if needed
		this._sendResyncRequest("any");
	}

	/**
	 * Inject HTML
	 *
	 * @private
	 */
	_injectHTML() {

		this.stage.init();

		/**
		 * Theatre Dock + Theatre Bar
		 */
		let body = document.getElementsByTagName("body")[0];

		this.theatreGroup = document.createElement("div");
		this.stage.initTheatreDockCanvas();
		this.toolTipCanvas.initTheatreToolTipCanvas();

		this.theatreGroup.id = "theatre-group";

		this.theatreNarrator = document.createElement("div");
		this.theatreNarrator.id = "theatre-narrator";

		let narratorBackdrop = document.createElement("div");
		let narratorContent = document.createElement("div");


		KHelpers.addClass(narratorBackdrop, "theatre-narrator-backdrop");
		KHelpers.addClass(narratorContent, "theatre-narrator-content");
		KHelpers.addClass(narratorContent, "no-scrollbar");
		KHelpers.addClass(this.theatreGroup, "theatre-group");
		KHelpers.addClass(this.theatreNarrator, "theatre-narrator");

		this.theatreNarrator.appendChild(narratorBackdrop);
		this.theatreNarrator.appendChild(narratorContent);

		this.theatreGroup.appendChild(this.stage.theatreDock);
		this.theatreGroup.appendChild(this.stage.theatreBar);
		this.theatreGroup.appendChild(this.theatreNarrator);
		this.theatreGroup.appendChild(this.toolTipCanvas.holder);

		body.appendChild(this.theatreGroup);
		// set theatreStyle
		this.configTheatreStyle(TheatreSettings.getTheatreStyle());
		// set narrator height
		const narrHeight = TheatreSettings.getNarratorHeight();
		this.theatreNarrator.style.top = `calc(${narrHeight} - 50px)`;

		this.theatreControls.initHtml();
	}


	configTheatreStyle(theatreStyle: AnyTheatreStyle) {

		if (Theatre.DEBUG) console.log("SWITCHING THEATRE BAR MODE : %s from %s", theatreStyle, this.currentTheatreStyle);


		this._removeCurrentTheatreStyle();

		this._addNewTheatreStyle(theatreStyle);

		this.currentTheatreStyle = theatreStyle;

		// re-render all inserts
		for (let insert of this.stage.stageInserts)
			this.renderInsertById(insert.imgId);

		// apply resize adjustments (ev is unused)
		this.updateGeometry();
	}

	_addNewTheatreStyle(theatreStyle: AnyTheatreStyle) {


		let primeBar = this.stage.primeBar;
		let secondBar = this.stage.secondBar;
		let textBoxes = this.stage.getTextBoxes();

		// apply new style
		switch (theatreStyle) {
			case TheatreStyle.LIGHTBOX:
				KHelpers.addClass(primeBar, "theatre-bar-lightleft");
				KHelpers.addClass(secondBar, "theatre-bar-lightright");
				this.stage.theatreBar.style.top = "calc(100% - 170px)";
				this.stage.theatreBar.style.height = "170px";
				this.stage.theatreBar.style.setProperty("border-radius", "5px 0px 0px 5px");
				this.stage.theatreBar.style.setProperty("box-shadow", "0 0 40px #000");
				this.stage.theatreBar.style.background = "linear-gradient(transparent, rgba(20,20,20,0.98) 5%,rgba(20,20,20,0.85) 40%, rgba(20,20,20,0.6) 70%, rgba(20,20,20,0.5) 95%)";
				for (let tb of textBoxes)
					KHelpers.addClass(tb, "theatre-text-box-light");
				break;
			case TheatreStyle.CLEARBOX:
				KHelpers.addClass(primeBar, "theatre-bar-clearleft");
				KHelpers.addClass(secondBar, "theatre-bar-clearright");
				this.stage.theatreBar.style.top = "calc(100% - 170px)";
				this.stage.theatreBar.style.height = "170px";
				this.stage.theatreBar.style.setProperty("border-radius", "unset");
				this.stage.theatreBar.style.setProperty("box-shadow", "unset");
				this.stage.theatreBar.style.background = "unset";
				for (let tb of textBoxes)
					KHelpers.addClass(tb, "theatre-text-box-clear");
				break;
			case TheatreStyle.MANGABUBBLE:
				throw new Error("Not Implemented");
			case TheatreStyle.TEXTBOX:
			default:
				KHelpers.addClass(primeBar, "theatre-bar-left");
				KHelpers.addClass(secondBar, "theatre-bar-right");
				this.stage.theatreBar.style.top = "calc(100% - 160px - 0.5vh)";
				this.stage.theatreBar.style.height = "160px";
				this.stage.theatreBar.style.setProperty("border-radius", "unset");
				this.stage.theatreBar.style.setProperty("box-shadow", "unset");
				this.stage.theatreBar.style.background = "unset";
				for (let tb of textBoxes)
					KHelpers.addClass(tb, "theatre-text-box");
				break;
		}
	}

	_removeCurrentTheatreStyle() {

		let primeBar = this.stage.primeBar;
		let secondBar = this.stage.secondBar;
		let textBoxes = this.stage.getTextBoxes();

		// clear old style
		switch (this.currentTheatreStyle || TheatreStyle.TEXTBOX) {
			case TheatreStyle.LIGHTBOX:
				KHelpers.removeClass(primeBar, "theatre-bar-left");
				KHelpers.removeClass(secondBar, "theatre-bar-right");
				KHelpers.removeClass(primeBar, "theatre-bar-lightleft");
				KHelpers.removeClass(secondBar, "theatre-bar-lightright");
				for (let tb of textBoxes) {
					KHelpers.removeClass(tb, "theatre-text-box-light");
					KHelpers.removeClass(tb, "theatre-text-box");
				}
				break;
			case TheatreStyle.CLEARBOX:
				KHelpers.removeClass(primeBar, "theatre-bar-left");
				KHelpers.removeClass(secondBar, "theatre-bar-right");
				KHelpers.removeClass(primeBar, "theatre-bar-clearleft");
				KHelpers.removeClass(secondBar, "theatre-bar-clearright");
				for (let tb of textBoxes) {
					KHelpers.removeClass(tb, "theatre-text-box-clear");
					KHelpers.removeClass(tb, "theatre-text-box");
				}
				break;
			case TheatreStyle.MANGABUBBLE:
				KHelpers.removeClass(primeBar, "theatre-bar-left");
				KHelpers.removeClass(secondBar, "theatre-bar-right");
				for (let tb of textBoxes) {
					KHelpers.removeClass(tb, "theatre-text-box");
				}
				// PLACEHOLDER FOR FUTURE
				break;
			case TheatreStyle.TEXTBOX:
			default:
				KHelpers.removeClass(primeBar, "theatre-bar-left");
				KHelpers.removeClass(secondBar, "theatre-bar-right");
				for (let tb of textBoxes)
					KHelpers.removeClass(tb, "theatre-text-box");
				break;
		}
	}

	/**
	 * Socket backup to the module method
	 *
	 * bind socket receiver for theatre events
	 *
	 * @private
	 */
	_initSocket() {
		// module socket
		game.socket.on(Theatre.SOCKET, payload => {
			if (Theatre.DEBUG) console.log("Received packet", payload)
			switch (payload.type) {
				case "sceneevent":
					this.sceneEventProcessor.processSceneEvent(payload.senderId, payload.subtype, payload.data);
					break;
				case "typingevent":
					this._processTypingEvent(payload.senderId, payload.data);
					break;
				case "resyncevent":
					this._processResyncEvent(payload.subtype, payload.senderId, payload.data);
					break;
				case "reqresync":
					this._processResyncRequest(payload.subtype, payload.senderId, payload.data);
					break;
				default:
					console.log("UNKNOWN THEATRE EVENT TYPE %s", payload.type, payload);
					break;
			}
		});

	}



	/**
	 * Send a packet to all clients indicating
	 *
	 * 1. Which insert we're speaking as, or no longer speaking as
	 * 2. Wether or not we're typing currently
	 * 3. What typing animations we've chosen
	 *
	 */
	_sendTypingEvent() {
		if (Theatre.DEBUG) console.log("Sending Typing Event")

		let insert = this.stage.getInsertById(this.speakingAs);
		let insertEmote = this._getEmoteFromInsert(insert);
		let insertTextFlyin =
			(insert ? this._getTextFlyinFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textflyin") : "typewriter"));
		let insertTextStanding =
			(insert ? this._getTextStandingFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textstanding") : "none"));
		let insertTextFont =
			(insert ? this._getTextFontFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textfont") : null));
		let insertTextSize =
			(insert ? this._getTextSizeFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textsize") : null));
		let insertTextColor =
			(insert ? this._getTextColorFromInsert(insert) : (this.speakingAs == Theatre.NARRATOR ? this.theatreNarrator.getAttribute("textcolor") : null));

		let emotedata = {
			emote: insertEmote,
			textflyin: insertTextFlyin,
			textstanding: insertTextStanding,
			textfont: insertTextFont,
			textsize: insertTextSize,
			textcolor: insertTextColor
		}

		game.socket.emit(Theatre.SOCKET,
			{
				senderId: game.user.id,
				type: "typingevent",
				data: {
					insertid: this.speakingAs,
					emotions: emotedata
				}
			},
		);

	}


	/**
	 * Someone is asking for a re-sync event, so we broadcast the entire scene
	 * state to this target individual
	 *
	 * @param targetId (String) : The userId whom is requesting a resync event
	 *
	 * @private
	 */
	_sendResyncEvent(targetId: string): void {

		let insertData = this._buildResyncData();
		if (Theatre.DEBUG) console.log("Sending RESYNC Event (isGM)%s (to)%s: ", game.user.isGM, targetId, insertData)

		game.socket.emit(Theatre.SOCKET,
			{
				senderId: game.user.id,
				type: "resyncevent",
				subtype: (game.user.isGM ? "gm" : "player"),
				data: {
					targetid: targetId,
					insertdata: insertData,
					narrator: this.isNarratorActive
				}
			},
		);

	}

	/**
	 * Compiles Resync insertdata
	 *
	 * @return (Array[Object]) : The array of objects that represent an insert's data
	 *
	 */
	_buildResyncData(): InsertData[] {
		let insertData = [];
		for (let idx = 0; idx < this.stage.stageInserts.length; ++idx) {
			let insert = this.stage.stageInserts[idx];
			let insertEmote = this._getEmoteFromInsert(insert);
			let insertTextFlyin = this._getTextFlyinFromInsert(insert);
			let insertTextStanding = this._getTextStandingFromInsert(insert);
			let insertTextFont = this._getTextFontFromInsert(insert);
			let insertTextSize = this._getTextSizeFromInsert(insert);
			let insertTextColor = this._getTextColorFromInsert(insert);

			let dat = {
				insertid: insert.imgId,
				position: {
					x: insert.portrait.x,
					y: insert.portrait.y,
					mirror: insert.mirrored
				},
				emotions: {
					emote: insertEmote,
					textFlyin: insertTextFlyin,
					textStanding: insertTextStanding,
					textFont: insertTextFont,
					textSize: insertTextSize,
					textColor: insertTextColor
				},
				sortidx: insert.order || 0
			}
			insertData.push(dat);
		}
		insertData.sort((a, b) => { return a.sortidx - b.sortidx });

		return insertData;
	}

	/**
	 * Send a request for for a Resync Event.
	 *
	 * Resync Request Types
	 *
	 * any : sender is asking for a resync packet from anyone
	 * gm : sender is asking for a resync packet from a GM
	 * players : sender is a GM and is telling all players to resync with them
	 *
	 * @param type (String) : The type of resync event, can either be "players" or "gm"
	 *						indicating Wether it's to resync "all players" or to resync with a gm (any GM)
	 */
	_sendResyncRequest(type: AnyResyncType): void {
		if (Theatre.DEBUG) console.log("Sending RESYNC Request ", type);

		// If there's a GM, request to resync from them
		let data = new ResyncData();
		if (type == "players" && game.user.isGM) {
			data.insertdata = this._buildResyncData();
			data.narrator = this.isNarratorActive;
		}

		game.socket.emit(Theatre.SOCKET,
			{
				senderId: game.user.id,
				type: "reqresync",
				subtype: type || "any",
				data: data
			},
		);

		if (type != "players") {
			this.resync.type = type;
			this.resync.timeoutId = window.setTimeout(() => {
				console.log("RESYNC REQUEST TIMEOUT");
				this.resync.timeoutId = null;
			}, 5000);
		}

	}

	/**
	 * Resync rquests can be either :
	 *
	 * any : sender is asking for a resync packet from anyone
	 * gm : sender is asking for a resync packet from a GM
	 * players : sender is a GM and is telling all players to resync with them
	 *
	 * @param type (String) : The type of resync request, can either be "players" or "gm"
	 * @param senderId (String) : The userId of the player requesting the resync event
	 * @param data (Object) : The data payload of the resync request. If the type is
	 *						"players" then chain process this as a resync event rather 
	 *						than a request. 
	 *
	 * @private
	 */
	_processResyncRequest(
		type: AnyResyncType,
		senderId: string,
		data: ResyncData): void {
		if (Theatre.DEBUG) console.log("Processing resync request");
		// If the dock is not active, no need to send anything
		if (type == "any" && this.dockActive <= 0 && !this.isNarratorActive) {
			console.log("OUR DOCK IS NOT ACTIVE, Not responding to reqresync")
			return;
		} else if (type == "gm" && !game.user.isGM) {
			return;
		} else if (type == "players") {
			// clear our theatre
			for (let insert of this.stage.stageInserts)
				this.stage.removeInsertById(insert.imgId, true);
			// process this as if it were a resyncevent
			this.resync.timeoutId = 1;
			this._processResyncEvent("gm", senderId, {
				targetid: game.user.id,
				insertdata: data.insertdata,
				narrator: data.narrator
			});
		} else {
			this._sendResyncEvent(senderId);
		}
	}

	/**
	 * Process a resync event, and if valid, unload all inserts, prepare assets for inserts to inject,
	 * and inject them. 
	 *
	 * @param type (String) : The type of the resync event, can either be "player" or "gm" indicating
	 *						the permission level of the sender (only player or gm atm). 
	 * @param senderId (String) : The userId of the player whom sent the resync event. 
	 * @param data (Object) : The data of the resync Event which will contain the
	 *						information of the inserts we need to load in. 
	 * @private
	 */
	_processResyncEvent(
		type: AnyResyncType,
		senderId: string,
		data: ResyncData) {

		// if we're resyncing and it's us that's the target
		if (this.resync.timeoutId && (data.targetid == game.user.id || ("gm" == type && this.resync.type == type))) {
			// drop all other resync responses, first come, first process
			window.clearTimeout(this.resync.timeoutId);
			this.resync.timeoutId = null;

			// clear our theatre
			for (let insert of this.stage.stageInserts)
				this.stage.removeInsertById(insert.imgId, true);

			if (type == "gm")
				ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.ResyncGM"));
			else
				ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.ResyncPlayer") + game.users.get(senderId).data.name);

			let theatreId, insert, actorId, params;

			let toInject: {
				params: Params,
				emotions: EmotionDefinition
			}[] = [];

			for (let dat of data.insertdata) {
				theatreId = dat.insertid;
				actorId = theatreId.replace("theatre-", "");
				params = Tools.getInsertParamsFromActorId(actorId);
				if (!params) continue;

				if (Theatre.DEBUG) console.log("params + emotions: ", params, dat.emotions);
				toInject.push({ params: params, emotions: dat.emotions });
			}

			// let the clearing animation complete
			window.setTimeout(() => {
				// stage all inserts; 
				let ids = data.insertdata.map(e => e.insertid);
				//once all inserts are staged, start our injections
				this.stageAllInserts(ids, (loader: PIXI.Loader, resources: PIXI.IResourceDictionary) => {
					// due to the 'dual dock' mode and how it combines, we can't just push the reverse
					// if we want to preserve order
					if (toInject.length >= 2) {
						this.injectLeftPortrait(
							toInject[toInject.length - 2].params.src,
							toInject[toInject.length - 2].params.name,
							toInject[toInject.length - 2].params.imgId,
							toInject[toInject.length - 2].params.optalign,
							{
								emote: toInject[toInject.length - 2].emotions.emote,
								textFlyin: toInject[toInject.length - 2].emotions.textFlyin,
								textStanding: toInject[toInject.length - 2].emotions.textStanding,
								textFont: toInject[toInject.length - 2].emotions.textFont,
								textSize: toInject[toInject.length - 2].emotions.textSize,
								textColor: toInject[toInject.length - 2].emotions.textColor
							},
							true);
						this.injectLeftPortrait(
							toInject[toInject.length - 1].params.src,
							toInject[toInject.length - 1].params.name,
							toInject[toInject.length - 1].params.imgId,
							toInject[toInject.length - 1].params.optalign,
							{
								emote: toInject[toInject.length - 1].emotions.emote,
								textFlyin: toInject[toInject.length - 1].emotions.textFlyin,
								textStanding: toInject[toInject.length - 1].emotions.textStanding,
								textFont: toInject[toInject.length - 1].emotions.textFont,
								textSize: toInject[toInject.length - 1].emotions.textSize,
								textColor: toInject[toInject.length - 1].emotions.textColor
							},
							true);
						for (let idx = toInject.length - 3; idx >= 0; --idx)
							this.injectLeftPortrait(
								toInject[idx].params.src,
								toInject[idx].params.name,
								toInject[idx].params.imgId,
								toInject[idx].params.optalign,
								{
									emote: toInject[idx].emotions.emote,
									textFlyin: toInject[idx].emotions.textFlyin,
									textStanding: toInject[idx].emotions.textStanding,
									textFont: toInject[idx].emotions.textFont,
									textSize: toInject[idx].emotions.textSize,
									textColor: toInject[idx].emotions.textColor
								},
								true);
					} else if (toInject.length == 1) {
						this.injectLeftPortrait(
							toInject[0].params.src,
							toInject[0].params.name,
							toInject[0].params.imgId,
							toInject[0].params.optalign,
							{
								emote: toInject[0].emotions.emote,
								textFlyin: toInject[0].emotions.textFlyin,
								textStanding: toInject[0].emotions.textStanding,
								textFont: toInject[0].emotions.textFont,
								textSize: toInject[0].emotions.textSize,
								textColor: toInject[0].emotions.textColor
							},
							true);
					}
					// finally apply positioning for 3n total run speed
					window.setTimeout(() => {
						for (let dat of data.insertdata) {
							insert = this.stage.getInsertById(dat.insertid);
							//console.log("attempting to apply position to ",insert,dat.insertid,dat); 
							if (insert) {
								if (Theatre.DEBUG) console.log("insert active post resync add, appying position");
								// apply mirror state
								/*
								if (Boolean(dat.position.mirror) != insert.mirrored)
									this._mirrorInsert(port,true); 
								*/
								if (Theatre.DEBUG) console.log("Mirror ? %s : %s", dat.position.mirror, insert.mirrored);
								if (Boolean(dat.position.mirror) != insert.mirrored) {
									if (Theatre.DEBUG) console.log("no match!");
									insert.mirrored = Boolean(dat.position.mirror);
								}
								// apply positioning data
								insert.portrait.scaleX = (insert.mirrored ? -1 : 1);
								insert.portrait.x = dat.position.x;
								insert.portrait.y = dat.position.y;
								// apply texyflyin/textstanding data
								insert.textFlyin = dat.emotions.textFlyin;
								insert.textStanding = dat.emotions.textStanding;
								insert.textFont = dat.emotions.textFont;
								insert.textSize = dat.emotions.textSize;
								insert.textColor = dat.emotions.textColor;
							}
						}
						// apply Narrator bar last
						this.toggleNarratorBar(data.narrator);
					}, 1000);
				});
			}, 1600);

		}
	}





	/**
	 * Merely getting the typing event is the payload, we just refresh the typing timout
	 * for the given userId
	 */

	/**
	 * Process a typing event payload
	 *
	 * @param userId (String) : The userId of the user that is typing
	 * @param data (Object) : The Object payload that contains the typing event data
	 *
	 * @private
	 */
	_processTypingEvent(userId: string, data: TypingEvent) {
		// Possibly other things ? 
		this.setUserTyping(userId, data.insertid);
		// emote information is a rider on this event, process it
		let emote = data.emotions.emote;
		let textFlyin = data.emotions.textFlyin;
		let textStanding = data.emotions.textStanding;
		let textFont = data.emotions.textFont;
		let textSize = data.emotions.textSize;
		let textColor = data.emotions.textColor;

		this.setUserEmote(userId, data.insertid, "emote", emote, true);
		this.setUserEmote(userId, data.insertid, "textflyin", textFlyin, true);
		this.setUserEmote(userId, data.insertid, "textstanding", textStanding, true);
		this.setUserEmote(userId, data.insertid, "textfont", textFont, true);
		this.setUserEmote(userId, data.insertid, "textsize", textSize.toString(), true);
		this.setUserEmote(userId, data.insertid, "textcolor", textColor, true);
		// if the insertid is our speaking id, update our emote menu
		if (data.insertid == this.speakingAs)
			this.emoteMenuRenderer.initialize();
	}


	/**
	 * Test Wether a user is typing given user id
	 *
	 * @param userId (String) : The userId of user to check
	 */
	isUserTyping(userId: string) {
		if (!this.usersTyping.get(userId)) return false;

		return this.usersTyping.get(userId).timeoutId;
	}

	/**
	 * Get the text color given the insert
	 *
	 * @param insert (Object) : An object represeting an insert
	 *
	 * @return (String) The text color active for the insert.
	 *
	 * @private
	 */
	_getTextColorFromInsert(insert: StageInsert) {
		if (!insert) return null;
		return insert.textColor;
	}
	/**
	 * Get the text size given the insert
	 *
	 * @param insert (Object) : An object represeting an insert
	 *
	 * @return (String) The text size active for the insert.
	 *
	 * @private
	 */
	_getTextSizeFromInsert(insert: StageInsert) {
		if (!insert) return null;
		return insert.textSize;
	}
	/**
	 * Get the text font given the insert
	 *
	 * @param insert (Object) : An object represeting an insert
	 *
	 * @return (String) The text font active for the insert.
	 *
	 * @private
	 */
	_getTextFontFromInsert(insert: StageInsert) {
		if (!insert) return null;
		return insert.textFont;
	}
	/**
	 * Get the text fly-in animation given the insert
	 *
	 * @param insert (Object) : An object represeting an insert
	 *
	 * @return (String) The text flyin active for the insert.
	 *
	 * @private
	 */
	_getTextFlyinFromInsert(insert: StageInsert) {
		if (!insert) return null;
		return insert.textFlyin;
	}
	/**
	 * Get the text standing animation given the insert
	 *
	 * @param insert (Object) : An object represeting an insert
	 *
	 * @return (String) The text standing active for the insert.
	 *
	 * @private
	 */
	_getTextStandingFromInsert(insert: StageInsert) {
		if (!insert) return null;
		return insert.textStanding;
	}

	/**
	 * Get the insert emote given the insert
	 *
	 * @param insert (Object) : An object represeting an insert
	 *
	 * @return (String) The emote active for the insert.
	 *
	 */
	_getEmoteFromInsert(insert: StageInsert) {
		if (!insert) return null;
		if (this.isDelayEmote)
			return insert.delayedOldEmote;
		return insert.emote;
	}

	/**
	 * Get the inserts which are typing based on if their users are typing
	 */
	getInsertsTyping() {
		let typing = [];
		for (let userId in this.usersTyping.keys())
			if (this.usersTyping.get(userId).theatreId)
				typing.push(userId);

		return typing;
	}

	/**
	 * Set the user emote state, and change the insert if one is active for that
	 * user.
	 *
	 * @param userId (String) : The userId of the user whom triggered the emote state change
	 * @param theatreId (String) : The theatreId of the insert that is changing
	 * @param subType (String) : The subtype of the emote state that is being changed
	 * @param value (String) : The value of the emote state that is being set
	 * @param remote (Boolean) : Boolean indicating if this is a remote or local action
	 */
	setUserEmote(
		userId: string,
		theatreId: string,
		subType: string,
		value: string,
		remote: boolean = false) {

		if (!this.userEmotes.get(userId))
			this.userEmotes.set(userId, new EmotionDefinition());

		const userEmoting: EmotionDefinition = this.userEmotes.get(userId);
		const insert: StageInsert = this.stage.getInsertById(theatreId);

		switch (subType) {
			case "textfont":
				if (insert) {
					if (value) insert.textFont = value;
					else insert.textFont = null;
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textfont", value);
					else this.theatreNarrator.removeAttribute("textfont");
				} else {
					userEmoting.textFont = value;
				}
				break;
			case "textsize":
				if (insert) {
					if (value) insert.textSize = parseInt(value);
					else insert.textSize = null;
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textsize", value);
					else this.theatreNarrator.removeAttribute("textsize");
					userEmoting.textSize = parseInt(value);
				} else {
					userEmoting.textSize = parseInt(value);
				}
				break;
			case "textcolor":
				if (insert) {
					if (value) insert.textColor = value;
					else insert.textColor = null;
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textcolor", value);
					else this.theatreNarrator.removeAttribute("textcolor");
				} else {
					userEmoting.textColor = value;
				}
				break;
			case "textflyin":
				if (insert) {
					if (value) insert.textFlyin = value;
					else insert.textFlyin = null;
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textflyin", value);
					else this.theatreNarrator.removeAttribute("textflyin");
				} else {
					userEmoting.textFlyin = value;
				}
				break;
			case "textstanding":
				if (insert) {
					if (value) insert.textStanding = value;
					else insert.textStanding = null;
				} else if (theatreId == Theatre.NARRATOR) {
					if (value) this.theatreNarrator.setAttribute("textstanding", value);
					else this.theatreNarrator.removeAttribute("textstanding");
				} else {
					userEmoting.textStanding = value;
				}
				break;
			case "emote":
				// if provided a theatreId, set that insert's emote image + effects
				if (insert) {
					// if we're delaying our emote, and ths user is us, hold off on setting it
					if (this.isDelayEmote
						&& userId == game.user.id
						&& (this.delayedSentState == 0 || this.delayedSentState == 1)) {
						if (this.delayedSentState == 0) {
							insert.delayedOldEmote = insert.emote;
							this.delayedSentState = 1;
						}
						if (Theatre.DEBUG) console.log("DELAYING EMOTE %s, 'showing' %s", value, insert.delayedOldEmote);
					} else {
						insert.delayedOldEmote = insert.emote;
						this.setEmoteForInsertById(value, theatreId, remote);
					}
					if (value) insert.emote = value;
					else insert.emote = null;
				} else {
					userEmoting.emote = value;
				}
				break;
		}
		// Send to socket
		if (Theatre.DEBUG) console.log("SEND EMOTE PACKET %s,%s ??", this.isDelayEmote, this.delayedSentState);
		if (!remote && (!this.isDelayEmote || this.delayedSentState == 2) && (insert || theatreId == Theatre.NARRATOR)) {
			if (Theatre.DEBUG) console.log("SENDING EMOTE PACKET %s,%s", this.isDelayEmote, this.delayedSentState);
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.emote, {
				insertid: (insert ? insert.imgId : Theatre.NARRATOR),
				emotions: {
					emote: (insert ? this._getEmoteFromInsert(insert) : null),
					textFlyin: (insert ? this._getTextFlyinFromInsert(insert) : this.theatreNarrator.getAttribute("textflyin")),
					textStanding: (insert ? this._getTextStandingFromInsert(insert) : this.theatreNarrator.getAttribute("textstanding")),
					textFont: (insert ? this._getTextFontFromInsert(insert) : this.theatreNarrator.getAttribute("textfont")),
					textSize: (insert ? this._getTextSizeFromInsert(insert) : this.theatreNarrator.getAttribute("textsize")),
					textColor: (insert ? this._getTextColorFromInsert(insert) : this.theatreNarrator.getAttribute("textcolor")),
				}
			});
		}
	}

	/**
	 * set the user as typing, and or update the last typed
	 *
	 * @param userId (String) : The userId of the user that is to be set as 'typing'.
	 * @param theatreId (String) : The theatreId the user is 'typing' as.
	 */
	setUserTyping(
		userId: string,
		theatreId: string) {
		if (!this.usersTyping.get(userId))
			this.usersTyping.set(userId, new User());

		let userTyping = this.usersTyping.get(userId);
		if (userTyping.timeoutId)
			window.clearTimeout(userTyping.timeoutId);

		// clear old speakingId if it still exists
		if (theatreId != userTyping.theatreId) {
			let insert = this.stage.getInsertById(userTyping.theatreId);
			// if not destroyed already
			if (insert && insert.portrait) {
				// kill tweens
				// hide
				this._removeDockTween(insert.imgId, null, "typingAppear");
				this._removeDockTween(insert.imgId, null, "typingWiggle");
				this._removeDockTween(insert.imgId, null, "typingBounce");
				// fade away
				let oy = insert.portrait.height -
					(insert.optAlign == "top" ? 0 : this.stage.theatreBar.offsetHeight);

				// style specific settings
				switch (TheatreSettings.getTheatreStyle()) {
					case TheatreStyle.LIGHTBOX:
						break;
					case TheatreStyle.CLEARBOX:
						oy += (insert.optAlign == "top" ? 0 : this.stage.theatreBar.offsetHeight);
						break;
					case TheatreStyle.MANGABUBBLE:
						break;
					case TheatreStyle.TEXTBOX:
						break;
					default:
						break;
				}

				let tweenId = "typingVanish";
				let tween = TweenMax.to(insert.typingBubble, 0.2, {
					pixi: { scaleX: 0.01, scaleY: 0.01, alpha: 0, y: oy },
					ease: Power0.easeNone,
					onComplete: function (ctx, imgId, tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId, this, tweenId);
						this.targets()[0].scale.x = 1;
						this.targets()[0].scale.y = 1;
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this, insert.imgId, tweenId]
				});
				this._addDockTween(insert.imgId, tween, tweenId);

				//insert.typingBubble.alpha = 0; 
				userTyping.theatreId = null;
			}
		}

		if (theatreId) {
			let insert = this.stage.getInsertById(theatreId);
			// if not destroyed already
			if (insert && insert.portrait && !insert.tweens["typingWiggle"]) {
				// start tweens
				// show
				this._removeDockTween(insert.imgId, null, "typingVanish");

				let tweenId = "typingAppear";
				insert.typingBubble.scale.x = 0.01;
				insert.typingBubble.scale.y = 0.01;

				let tween = TweenMax.to(
					insert.typingBubble,
					0.2,
					{
						pixi: { scaleX: 1, scaleY: 1, alpha: 1 },
						ease: Power0.easeNone,
						onComplete: function (ctx, imgId, tweenId) {
							// decrement the rendering accumulator
							ctx._removeDockTween(imgId, this, tweenId);
							this.targets()[0].scale.x = 1;
							this.targets()[0].scale.y = 1;
							// remove our own reference from the dockContainer tweens
						},
						onCompleteParams: [this, insert.imgId, tweenId]
					});

				this._addDockTween(insert.imgId, tween, tweenId);

				tweenId = "typingWiggle";
				insert.typingBubble.rotation = 0.174533;
				tween = TweenMax.to(insert.typingBubble, 0.5, {
					pixi: { rotation: -10 },
					ease: Power0.easeNone,
					repeat: -1,
					yoyo: true,
					onComplete: function (ctx, imgId, tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId, this, tweenId);
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this, insert.imgId, tweenId]
				});
				this._addDockTween(insert.imgId, tween, tweenId);

				let oy = insert.portrait.height -
					(insert.optAlign == "top" ? 0 : this.stage.theatreBar.offsetHeight) - insert.label.style.lineHeight * 0.75;
				// style specific settings
				switch (TheatreSettings.getTheatreStyle()) {
					case TheatreStyle.CLEARBOX:
						insert.typingBubble.y = insert.portrait.height;
						oy += (insert.optAlign == "top" ? 0 : this.stage.theatreBar.offsetHeight);
						break;
					case TheatreStyle.MANGABUBBLE:
					case TheatreStyle.LIGHTBOX:
					case TheatreStyle.TEXTBOX:
					default:
						insert.typingBubble.y = insert.portrait.height - (insert.optAlign == "top" ? 0 : this.stage.theatreBar.offsetHeight);
						break;
				}

				tweenId = "typingBounce";
				tween = TweenMax.to(insert.typingBubble, 0.25, {
					pixi: { y: oy },
					ease: Power3.easeOut,
					repeat: -1,
					yoyo: true,
					yoyoEase: Power0.easeNone,
					onComplete: function (ctx, imgId, tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId, this, tweenId);
						this.targets()[0].y = oy;
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this, insert.imgId, tweenId]
				});
				this._addDockTween(insert.imgId, tween, tweenId);


				//insert.typingBubble.alpha = 1; 
				userTyping.theatreId = theatreId;
			} else if (theatreId == Theatre.NARRATOR) {
				userTyping.theatreId = theatreId;
			}
		}

		userTyping.timeoutId = window.setTimeout(() => {
			if (Theatre.DEBUG) console.log("%s typing timeout", userId);
			this.removeUserTyping(userId);
		}, 6000);
	}


	/**
	 * set the user as no longer typing
	 *
	 * @param userId (String) : The userId to remove as 'typing'.
	 */
	removeUserTyping(userId: string) {
		if (Theatre.DEBUG) console.log("removeUserTyping: ", this.usersTyping.get(userId));
		if (!this.usersTyping.get(userId)) {
			this.usersTyping.set(userId, new User());
			return;
		}
		if (!this.usersTyping.get(userId).timeoutId)
			return;

		if (this.usersTyping.get(userId).theatreId) {
			let insert = this.stage.getInsertById(this.usersTyping.get(userId).theatreId);
			// if not destroyed already
			if (insert) {
				// kill tweens
				// hide
				this._removeDockTween(insert.imgId, null, "typingAppear");
				this._removeDockTween(insert.imgId, null, "typingWiggle");
				this._removeDockTween(insert.imgId, null, "typingBounce");
				// fade away
				let oy = insert.portrait.height -
					(insert.optAlign == "top" ? 0 : this.stage.theatreBar.offsetHeight);
				// style specific settings
				switch (TheatreSettings.getTheatreStyle()) {
					case TheatreStyle.LIGHTBOX:
						break;
					case TheatreStyle.CLEARBOX:
						oy += (insert.optAlign == "top" ? 0 : this.stage.theatreBar.offsetHeight);
						break;
					case TheatreStyle.MANGABUBBLE:
						break;
					case TheatreStyle.TEXTBOX:
						break;
					default:
						break;
				}

				let tweenId = "typingVanish";
				let tween = TweenMax.to(insert.typingBubble, 0.2, {
					pixi: { scaleX: 0.01, scaleY: 0.01, alpha: 0, y: oy },
					ease: Power0.easeNone,
					onComplete: function (ctx, imgId, tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId, this, tweenId);
						this.targets()[0].scale.x = 1;
						this.targets()[0].scale.y = 1;
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this, insert.imgId, tweenId]
				});
				this._addDockTween(insert.imgId, tween, tweenId);

				//insert.typingBubble.alpha = 0; 
			}
		}

		if (Theatre.DEBUG) console.log("%s is no longer typing (removed)", userId);
		window.clearTimeout(this.usersTyping.get(userId).timeoutId);
		this.usersTyping.get(userId).timeoutId = null;
	}

	/**
	 * Determine if the default animations are disabled given a theatreId
	 *
	 * @param theatreId (String) : The theatreId who's theatre properties to
	 *							 test for if the default animations are disabled. 
	 *
	 * @return (Boolean) : True if disabled, false if not, null if the actor
	 *					  does not exist
	 */
	isDefaultDisabled(theatreId: string) {
		let actorId = theatreId.replace("theatre-", "");
		let actor = game.actors.get(actorId);

		if (!actor) {
			console.log("ERROR, ACTOR %s DOES NOT EXIST!", actorId);
			return null;
		}

		if (Theatre.DEBUG) console.log('isDefaultDisabled ', actor);

		if (actor.data.flags.theatre && actor.data.flags.theatre.disabledefault)
			return true;
		return false;
	}

	/**
	 * Given the userId and theatreId, determine of the user is an 'owner'
	 *
	 * @params userId (String) : The userId of the user to check.
	 * @params theatreId (String) : The theatreId of insert to check.
	 *
	 * @return (Boolean) : True if the userId owns the actor, False otherwise
	 *					  including if the actor for the theatreId does not exist. 
	 */
	isActorOwner(
		userId: string,
		theatreId: string) {

		let user = game.users.get(userId);
		if (user.isGM) return true;
		let actorId = theatreId.replace("theatre-", "");
		let actor = game.actors.get(actorId);

		if (!actor) {
			console.log("ERROR, ACTOR %s DOES NOT EXIST!", actorId);
			return false;
		}
		actor = actor.data;
		if ((actor.permission[userId] && actor.permission[userId] >= 3)
			|| (actor.permission["default"] && actor.permission["default"] >= 3))
			return true;
		return false;
	}

	/**
	 * Is the theatreId of a player controlled actor?
	 *
	 * @params theatreId (String) : The theatreId of the insert to checkA
	 *
	 * @return (Boolean) : True if the insert is player controlled, False otherwise
	 */
	isPlayerOwned(theatreId: string) {
		if (game.user.isGM) return true;
		let actorId = theatreId.replace("theatre-", "");
		let actor = game.actors.get(actorId);
		let user;

		if (!actor) {
			console.log("ERROR, ACTOR %s DOES NOT EXIST!", actorId);
			return;
		}
		actor = actor.data;
		for (let perm in actor.permission) {
			if (perm != "default") {
				user = game.users.get(perm);
				if (!user.isGM)
					return true;
			} else {
				if (actor.permission[perm] >= 1)
					return true;
			}
		}
		return false;
	}

	/**
	 * Immediately render this insert if it is active with whatever
	 * parameters it has
	 *
	 * @params id (String) : The theatreId of the insert to render.
	 */
	renderInsertById(id: string): void {
		let insert = this.stage.getInsertById(id);
		let actorId = id.replace("theatre-", "");
		let resName = "icons/myster-man.png";
		let params = Tools.getInsertParamsFromActorId(actorId);
		if (!insert || !params) return;

		if (insert.emote
			&& params.emotes[insert.emote].insert
			&& params.emotes[insert.emote].insert != "")
			resName = params.emotes[insert.emote].insert;
		else
			resName = params.src;

		// bubble up dataum from the update
		insert.optAlign = params.optalign;
		insert.name = params.name;
		insert.label.text = params.name;

		this._clearPortraitContainer(id);
		this.workers.portrait_container_setup_worker.setupPortraitContainer(id, params.optalign, resName, PIXI.Loader.shared.resources);
		// re attach label + typing bubble
		insert.dockContainer.addChild(insert.label);
		insert.dockContainer.addChild(insert.typingBubble);

		this._repositionInsertElements(insert);

		if (!this.rendering)
			this._renderTheatre(performance.now());
	}

	/**
	 * Our efficient render loop? We want to render only when there's a tween running, if
	 * there's no animation handler running, we don't need to request an animation frame
	 *
	 * We do this by checking for a non-zero accumulator that increments when a handler
	 * is added, and decrements when a handler is removed, thus if the accumulator is > 0
	 * then there's something to animate, else there's nothing to animate, and thus nothing
	 * to render!
	 *
	 * @params time (Number) : The high resolution time, typically from performace.now() to
	 *						 update all current animation sequences within the PIXI context.
	 */
	_renderTheatre(time: number): void {
		// let the ticker update all its objects
		this.stage.pixiApplication.ticker.update(time);
		// this.stage.pixiCTX.renderer.clear(); // PIXI.v6 does not respect transparency for clear
		for (let insert of this.stage.stageInserts) {
			if (insert.dockContainer) {
				if (Theatre.DEBUG) this.updateTheatreDebugInfo(insert);
				// PIXI.v6 The renderer should not clear the canvas on rendering
				this.stage.pixiApplication.renderer.render(
					insert.dockContainer,
					undefined,
					false);
			}
			else {
				console.log("INSERT HAS NO CONTAINER! _renderTheatre : HOT-EJECTING it! ", insert);
				this._destroyPortraitDock(insert.imgId);
			}
		}
		if (this.renderAnims > 0) {
			requestAnimationFrame(this._renderTheatre.bind(this));
		} else {
			if (Theatre.DEBUG) console.log("RENDERING LOOP STOPPED");
			this.rendering = false;
		}
	}
	updateTheatreDebugInfo(insert: any) {
		throw new Error('Method not implemented.');
	}

	/**
	 * Add a dock tween animation, and increment our accumulator, start requesting animation frames
	 * if we aren't already requesting them
	 *
	 * @params imgId (String) : The theatreId of the tween that will be receiving it.
	 * @params tween (Object TweenMax) : The TweenMax object of the tween to be added.
	 * @params tweenId (String) : The tweenId for this tween to be added.
	 *
	 */
	_addDockTween(
		imgId: string,
		tween: TweenMax,
		tweenId: string): void {

		let insert = this.stage.getInsertById(imgId);
		if (!insert || !insert.dockContainer) {
			// if dockContainer is destroyed, destroy the tween we were trying to add
			console.log("Invalid Tween for %s", imgId);
			if (tween) tween.kill();
			return;
		}

		// if the tweenId exists, kill that one, and replace with the new
		if (insert.tweens[tweenId]) {
			insert.tweens[tweenId].kill();
			this.renderAnims--;
		}

		if (this.renderAnims > 0) {
			this.renderAnims++;
			insert.tweens[tweenId] = tween;
		} else {
			// if we're somehow negative, bump to 1
			this.renderAnims = 1;
			insert.tweens[tweenId] = tween;

			// Kick renderer if we need to
			if (!this.rendering) {
				if (Theatre.DEBUG) console.log("RENDERING LOOP STARTED");
				this.rendering = true;
				this._renderTheatre(performance.now());
			}
		}
	}

	/**
	 * Remove a dock tween animation, and decrement our accumulator, if the accumulator <= 0, the render
	 * loop will kill itself after the next render. Thus no model updates need be performed
	 *
	 * @params imgId (String) : The theatreId of the tween that will have it removed.
	 * @params tween (Object TweenMax) : The TweenMax object of the tween to be removed.
	 * @params tweenId (String) : The tweenId of the tween to be removed. 
	 *
	 */
	_removeDockTween(
		imgId: string,
		tween: TweenMax,
		tweenId: string): void {
		if (tween) tween.kill();

		let insert = this.stage.getInsertById(imgId);
		if (insert) {
			// if the tweenId doesn't exist, do nothing more
			if (!insert.tweens[tweenId])
				return;
			if (!tween)
				insert.tweens[tweenId].kill();
			insert.tweens[tweenId] = null;
			let nTweens: { [key: string]: TweenMax } = {};
			for (let prop in insert.tweens) {
				if (insert.tweens[prop] != null)
					nTweens[prop] = insert.tweens[prop];
			}
			// replace after we removed the prop
			insert.tweens = nTweens;
		}

		this.renderAnims--;

		//sanit check
		if (this.renderAnims < 0) {
			console.error("ERROR RENDER ANIM < 0 from %s of %s", tweenId, (insert ? insert.name : imgId));
			ui.notifications.error("ERROR RENDER ANIM < 0 ");
		}
	}

	/**
	 * Destroy a PIXI container in our dock by removing all animations it may have
	 * as well as destroying its children before destroying itself
	 *
	 * @params imgId (String) : The theatreId of the insert whose dockContainer will be destroyed.
	 *
	 */
	_destroyPortraitDock(imgId: string) {
		let insert = this.stage.getInsertById(imgId)
		if (insert && insert.dockContainer) {
			// kill and release all tweens
			for (let tweenId in insert.tweens)
				this._removeDockTween(imgId, null, tweenId);
			insert.tweens = null;
			// destroy children
			insert.portrait.destroy();

			for (let child of insert.dockContainer.children)
				child.destroy();
			insert.portrait = null;
			insert.label = null;
			// destroy self
			insert.dockContainer.destroy();
			insert.dockContainer = null;
			let idx = this.stage.stageInserts.findIndex(e => e.imgId == imgId);
			this.stage.stageInserts.splice(idx, 1);
			// The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
			if (game.settings.get(TheatreSettings.NAMESPACE, TheatreSettings.SHIFT_PAUSE_ICON))
				document.querySelectorAll("#pause").forEach(ele => KHelpers.removeClass(<HTMLElement>ele, "theatre-centered"));
			$('#players').removeClass("theatre-invisible");
			$('#hotbar').removeClass("theatre-invisible");
		}
		// force a render update
		//app.render(); 
		if (!this.rendering)
			this._renderTheatre(performance.now());

	}

	/**
	 * Reposition insert elements based
	 * on nameOrientation label length,
	 * and textBox position
	 *
	 * @params insert (Object) : An Object representing the insert
	 *
	 */
	_repositionInsertElements(insert: StageInsert) {
		if (!insert || !insert.portrait) {
			console.log("ERROR: No insert, or portrait available ", insert);
			return;
		}
		// re-align the dockContainer to the textBox and its nameOrientation
		let textBox = this.getTextBoxById(insert.imgId);
		let offset = KHelpers.offset(textBox);
		let leftPos = Math.round(
			Number(offset.left || 0)
			- Number(KHelpers.style(textBox)["left"].match(/\-*\d+\.*\d*/) || 0)
			- Number(KHelpers.style(this.stage.theatreBar).getPropertyValue("margin-left").match(/\-*\d+\.*\d*/) || 0)
		);
		// pre-split measurement
		insert.label.style.wordWrap = false;
		insert.label.style.wordWrapWidth = insert.portrait.width;
		let labelExceeds = (insert.label.width + 20 + insert.label.style.fontSize) > textBox.offsetWidth;
		let preLabelWidth = insert.label.width;
		// split measurement
		insert.label.style.wordWrap = true;
		insert.label.style.wordWrapWidth = textBox.offsetWidth;
		// Scale the name bar length and orient the portait
		if (insert.nameOrientation == "left") {
			insert.label.x = 20;
			insert.typingBubble.anchor.set(0.5);
			insert.typingBubble.x = Math.min(preLabelWidth + 20 + insert.typingBubble.width / 2, textBox.offsetWidth - insert.typingBubble.width / 2);

		} else {
			if (labelExceeds) {
				insert.label.x = insert.portrait.width - insert.label.width - 20;
				if (insert.label.width - 20 > insert.portrait.width)
					insert.typingBubble.x = Math.min(insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20, insert.typingBubble.width / 2);
				else
					insert.typingBubble.x = Math.max(insert.portrait.width - insert.label.width - insert.typingBubble.texture.width / 2 - 20, insert.typingBubble.width / 2);
			} else {
				insert.label.x = insert.portrait.width - preLabelWidth - 20;
				if (preLabelWidth - 20 > insert.portrait.width)
					insert.typingBubble.x = Math.min(insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20, insert.typingBubble.width / 2);
				else
					insert.typingBubble.x = Math.max(insert.portrait.width - preLabelWidth - insert.typingBubble.texture.width / 2 - 20, insert.typingBubble.width / 2);
			}

			insert.typingBubble.anchor.set(0.5);

			leftPos += textBox.offsetWidth - insert.portrait.width;
		}
		insert.typingBubble.y = insert.portrait.height -
			(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight + insert.typingBubble.height / 2;
		// if the label height > font-size, it word wrapped wrap, so we need to bump up the height
		if (labelExceeds) {
			let divisor = Math.round(insert.label.height / insert.label.style.lineHeight);
			insert.label.y = insert.portrait.height -
				(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - (insert.label.style.lineHeight * divisor);
		} else {
			// normal
			insert.label.y = insert.portrait.height -
				(insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight) - insert.label.style.lineHeight;
		}
		insert.typingBubble.rotation = 0.1745;
		insert.dockContainer.x = leftPos;
		insert.dockContainer.y = this.stage.theatreDock.offsetHeight
			- (insert.optAlign == "top" ? this.stage.theatreBar.offsetHeight : 0) - insert.portrait.height;

		// theatreStyle specific adjustments
		switch (TheatreSettings.getTheatreStyle()) {
			case TheatreStyle.LIGHTBOX:
				// to allow top-aligned portraits to work without a seam
				insert.dockContainer.y += (insert.optAlign == "top" ? 8 : 0);
				insert.label.y -= (insert.optAlign == "top" ? 8 : 0);
				break;
			case TheatreStyle.CLEARBOX:
				insert.dockContainer.y = this.stage.theatreDock.offsetHeight - insert.portrait.height;
				insert.label.y += (insert.optAlign == "top" ? 0 : Theatre.instance.theatreBar.offsetHeight);
				insert.typingBubble.y += (insert.optAlign == "top" ? 0 : Theatre.instance.offsetHeight);
				break;
			case TheatreStyle.MANGABUBBLE:
				break;
			case TheatreStyle.TEXTBOX:
				break;
			default:
				break;
		}
	}

	/**
	 * Add Resource
	 *
	 * We want to add an asset to the the PIXI Loader
	 *
	 * @params imgSrc (String) : The url of the image that will replace the resource
	 * @params resName (String) : The resource name to replace
	 * @params imgId (String) : The theatreId of the insert whose resource is being replaced
	 * @params cb (Function) : The callback to invoke once we're done replacing the resource
	 * @params remote (Boolean) : Boolean indicating if thist call is being done remotely or locally.
	 *
	 */
	async _AddTextureResource(
		imgSrc: string,
		resName: string,
		imgId: string,
		emote: string,
		cb: SomeCallBack,
		remote: boolean = false) {
		// First we pull the insert,canvas,and pixi app from the imgId.
		// Second, we want to verify that the source image exists, if so,
		// then we'll proceed.
		// X Third, we will kill all inserts that are currently having one of their resources (we can keep the canvas up)
		// replaced as a safety measure.
		// Fourth, we will delete the resource via .delete() from the loader
		// Fifth, we will load in the resource, and then broadcast to all other clients to
		// also replace their resources.
		// ** NOTE this may have desync issues **

		let insert = this.stage.getInsertById(imgId);
		// If no insert/container, this is fine
		let actorId = imgId.replace("theatre-", "");
		let actorParams = Tools.getInsertParamsFromActorId(actorId);
		// no actor is also fine if this is some kind of rigging resource

		// src check, not fine at all!
		if (!await srcExists(imgSrc)) {
			console.log("ERROR (_AddTextureResource) : Replacement texture does not exist %s ", imgSrc);
			return;
		}

		let loader = PIXI.Loader.shared;
		/*
		if (loader.resources[resName])
			loader.resources[resName] = null; 
		*/

		// if we have no resName then just return the cb
		if (!resName || resName == "") {
			cb.call(this, loader, loader.resources);
			return;
		}

		let imgSrcs = [{ resname: resName, imgpath: imgSrc }];
		if (Theatre.DEBUG) console.log("replace textures", imgSrcs);
		this._addSpritesToPixi(imgSrcs, cb);

		// Send to socket
		if (!remote) {
			// broadcast change to clients
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.addtexture, {
				insertid: imgId,
				imgsrc: imgSrc,
				resname: resName,
				emote: emote
			});
		}

	}

	/**
	 * Add All Texture Resources 
	 *
	 * Add an array of assets to the PIXI Loader
	 *
	 * @param imgSrcs (Array) : An array of Objects consiting of {imgsrc: <value>, resname: <value>}
	 *						  of the resources to replace.
	 * @param imgId (String) : The TheatreId of the insert whose textures will be replaced.
	 * @param emote (String) : The currently active emote, if any.
	 * @param cb (Function) : The function callback to invoke when the resources are loaded.
	 * @param remote (Boolean) : Wether or not this function is being invoked remotely, if not, then
	 *						   we want to broadcast to all other clients to perform the action as well. 
	 */
	async _AddAllTextureResources(
		imgSrcs: ImageSource[],
		imgId: string,
		emote: string,
		eresName: string,
		cb: SomeCallBack,
		remote: boolean = false) {
		// First we pull the insert,canvas,and pixi app from the imgId.
		// Second, we want to verify that the source image exists, if so,
		// then we'll proceed.
		// X Third, we will kill all inserts that are currently having one of their resources (we can keep the canvas up)
		// replaced as a safety measure.
		// Fourth, we will delete the resource via .delete() from the loader
		// Fifth, we will load in the resource, and then broadcast to all other clients to
		// also replace their resources.
		// ** NOTE this may have desync issues **

		let insert = this.stage.getInsertById(imgId);
		// If no insert/container, this is fine
		let actorId = imgId.replace("theatre-", "");
		let actorParams = Tools.getInsertParamsFromActorId(actorId);
		// no actor is also fine if this is some kind of rigging resource

		// src check, not fine at all!
		for (let src of imgSrcs)
			if (!await srcExists(src.imgpath)) {
				console.log("ERROR (_AddAllTextureResources) : Replacement texture does not exist %s ", src);
				return;
			}

		let loader = PIXI.Loader.shared;
		/*
		if (loader.resources[resName])
			loader.resources[resName] = null; 
		*/

		// if we have an emtpy imgSrc array, just return the cb
		if (imgSrcs.length <= 0) {
			cb.call(this, loader, loader.resources);
			return;
		}

		if (Theatre.DEBUG) console.log("replace textures", imgSrcs);
		this._addSpritesToPixi(imgSrcs, (loader, resources) => {
			cb.call(this, loader, resources);
		});

		// Send to socket
		if (!remote) {
			// broadcast change to clients
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.addalltextures, {
				insertid: imgId,
				imgsrcs: imgSrcs,
				emote: emote,
				eresname: eresName
			});
		}

	}


	/**
	 * Clear the container by ending all animations, and removing all sprites
	 *
	 * @param imgId : The theatreId of the insert whose dockContainer we should
	 *				clear. 
	 *
	 */
	_clearPortraitContainer(imgId: string) {
		let insert = this.stage.getInsertById(imgId);
		if (!insert || !insert.dockContainer || !insert.portrait) return;

		// preserve position without portrait offset
		let ox = insert.portrait.x;
		let oy = insert.portrait.y;
		let ocx = insert.dockContainer.x;
		let ocy = insert.dockContainer.y;
		let oLabelAnim = insert.tweens["nameSpeakingPulse"];
		let oTypingBounceAnim = insert.tweens["typingBounce"];
		let oTypingWiggleAnim = insert.tweens["typingWiggle"];
		let oTypingAppearAnim = insert.tweens["typingAppear"];
		let oTypingVanishAnim = insert.tweens["typingVanish"];
		// kill and release all tweens, except for label or typingBubble
		// animation
		for (let tweenId in insert.tweens) {
			if (tweenId == "nameSpeakingPulse"
				|| tweenId == "typingBounce"
				|| tweenId == "typingAppear"
				|| tweenId == "typingVanish"
				|| tweenId == "typingWiggle")
				continue;
			this._removeDockTween(imgId, null, tweenId);
		}
		insert.tweens = {};
		if (oLabelAnim)
			insert.tweens["nameSpeakingPulse"] = oLabelAnim;
		if (oTypingBounceAnim)
			insert.tweens["typingBounce"] = oTypingBounceAnim;
		if (oTypingWiggleAnim)
			insert.tweens["typingWiggle"] = oTypingWiggleAnim;
		if (oTypingAppearAnim)
			insert.tweens["typingAppear"] = oTypingAppearAnim;
		if (oTypingVanishAnim)
			insert.tweens["typingVanish"] = oTypingVanishAnim;

		insert.portrait.destroy();

		// attempt to preserve label + typingBubble
		for (let idx = insert.dockContainer.children.length - 1; idx >= 0; --idx) {
			let child = insert.dockContainer.children[idx];
			if (child.theatreComponentName && child.theatreComponentName == "label")
				insert.dockContainer.removeChildAt(idx);
			else if (child.theatreComponentName && child.theatreComponentName == "typingBubble")
				insert.dockContainer.removeChildAt(idx);
			else
				child.destroy();
		}


		insert.portrait = null;
		// destroy self
		insert.dockContainer.destroy();
		insert.dockContainer = null;
		// re-generate the container
		const newDockContainer = new PIXI.Container();
		const newPortrait = new Portrait(this.stage);
		newPortrait.init();
		newDockContainer.addChild(newPortrait.root);
		insert.portrait = newPortrait;
		// initial positioning
		newDockContainer.x = ocx;
		newDockContainer.y = ocy
		newPortrait.x = ox;
		newPortrait.y = oy;
		// assignment
		insert.dockContainer = newDockContainer;
		if (Theatre.DEBUG) console.log("saving ox: %s, oy: %s", ox, oy);
		// label is NOT re-attached, must be done by the clearer
		// typingBubble is NOT re-attached, must be done by the clearer
		// mirror-state is NOT restored, must be done by the clearer

	}

	/**
	 * Add sprites to the PIXI Loader
	 *
	 * @param imcSrcs: An array of {imgsrc: (String), resname (String)} pairs
	 *								   representing the assets to be loaded into PIXI's loader.
	 * @param cb : The function to invoke once the assets are loaded. 
	 *
	 */
	_addSpritesToPixi(
		imgSrcs: ImageSource[],
		cb: SomeCallBack) {

		let loader = PIXI.Loader.shared;

		// Load in our resources if needed


		// if loader is running, we will stick a timeout and wait,
		// possibly fighting with others on the event looop for the loader
		if (!loader.loading) {
			if (Theatre.DEBUG) console.log("resources", loader);
			for (let imgTuple of imgSrcs) {
				let resName = imgTuple.resname;
				if (!loader.resources[resName])
					loader.add(resName, imgTuple.imgpath);
			}

			loader.load((loader, resources) => {
				cb.call(this, loader, resources);
			});
		} else {
			window.setTimeout(() => {
				if (Theatre.DEBUG) console.log("loader not done, waiting");
				this._getLoaderChainWait(imgSrcs, cb).call(this);
			}, 200);
		}
	}

	/**
	 * Loader chain waiting
	 *
	 * @params ctx (Context) : The context to invoke the callback with
	 * @params imcSrcs (Array[Object]) : An array of {imgsrc: (String), resname (String)} pairs
	 *								   representing the assets to be loaded into PIXI's loader.
	 * @params cb (Function) : The function to invoke once the assets are loaded. 
	 *
	 * @private
	 */
	_getLoaderChainWait(
		imgSrcs: ImageSource[],
		cb: SomeCallBack) {
		let loader = PIXI.Loader.shared;
		let func = () => {
			if (!loader.loading) {
				if (Theatre.DEBUG) console.log("delayed loading resources", loader);
				for (let imgTuple of imgSrcs) {
					let resName = imgTuple.resname;
					if (!loader.resources[resName])
						loader.add(resName, imgTuple.imgpath);
				}

				loader.load(cb);
			} else {
				window.setTimeout(() => {
					if (Theatre.DEBUG) console.log("loader not done, waiting");
					this._getLoaderChainWait(imgSrcs, cb).call(this);
				}, 200);
			}
		}
		return func;
	}

	/**
	 * Given an array of theatreIds, stage them all
	 *
	 * @params ids (Array[(String)] : An array of theatreIds of inserts to load.
	 * @params cb (Function) : The function to invoke once the assets are loaded. 
	 */
	stageAllInserts(
		ids: string[],
		cb: SomeCallBack) {

		let actorId, params;
		let imgSrcs: ImageSource[] = [];
		for (let id of ids) {
			actorId = id.replace("theatre-", "");
			params = Tools.getInsertParamsFromActorId(actorId);
			if (!params) continue;

			// base insert
			imgSrcs.push({ imgpath: params.src, resname: params.src });

			// load all rigging assets
			let rigResources = ActorExtensions.getRiggingResources(actorId);

			if (Theatre.DEBUG) console.log("RigResources for %s :", params.name, rigResources);

			for (let rigResource of rigResources)
				imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });

			// load all emote base images + rigging for the emotes
			for (let emName in params.emotes)
				if (params.emotes[emName])
					if (params.emotes[emName].insert && params.emotes[emName].insert != "")
						imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });
		}

		// load in the sprites
		this._addSpritesToPixi(imgSrcs, cb);
	}

	/**
	 * "Stages" an insert by pre-loading the base + all emote images
	 *
	 * @params theatreId (String) : The theatreId of the insert to load.
	 * @params remote (Boolean) : Whether this is being invoked remotely or locally. 
	 */
	stageInsertById(
		theatreId: string,
		remote: boolean = false): void {

		let actorId = theatreId.replace("theatre-", "");
		let params = Tools.getInsertParamsFromActorId(actorId);

		if (!params) return;

		// kick asset loader to cache the portrait + emotes
		let imgSrcs = [];

		// get actor, load all emote images
		if (!params) {
			console.log("ERROR: Actor does not exist for %s", actorId);
			return null;
		}

		imgSrcs.push({ imgpath: params.src, resname: params.src });

		// load all rigging assets
		let rigResources = ActorExtensions.getRiggingResources(actorId);

		for (let rigResource of rigResources)
			imgSrcs.push({ imgpath: rigResource.path, resname: rigResource.path });

		// load all emote base images + rigging for the emotes
		for (let emName in params.emotes)
			if (params.emotes[emName])
				if (params.emotes[emName].insert && params.emotes[emName].insert != "")
					imgSrcs.push({ imgpath: params.emotes[emName].insert, resname: params.emotes[emName].insert });

		// load in the sprites
		this._addSpritesToPixi(imgSrcs, ((loader, resources) => {
			if (Theatre.DEBUG) console.log("staging complete for %s", theatreId, resources);
		}));

		// Send socket event
		if (!remote)
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.stage, { insertid: theatreId })
	}

	/**
	 * Set the emote given the id
	 *
	 * @param ename  : The emote name.
	 * @param id : The theatreId of the insert. 
	 * @param remote  : Wether this is being invoked remotely or locally. 
	 */
	setEmoteForInsertById(
		ename: string,
		id: string,
		remote: boolean = false): void {

		let insert = this.stage.getInsertById(id);

		this.emoteSetter.setEmoteForInsert(ename, insert, remote);
	}
	/**
	 * Set the emote given the name
	 *
	 * @params ename (String) : The emote name.
	 * @params name (String) : The label name of the insert. 
	 * @params remote (Boolean) : Wether this is being invoked remotely or locally. 
	 */
	setEmoteForInsertByName(
		ename: string,
		name: string,
		remote: boolean = false) {

		let insert = this.stage.getInsertByName(name);

		this.emoteSetter.setEmoteForInsert(ename, insert, remote);
	}



	/**
	 * Add a textBox to the theatreBar
	 *
	 * @params textBox (HTMLElement) : The textBox to add to the theatreBar,
	 *								 MUST correspond to an insert. 
	 * @params isLeft (Boolean) : Wether this textBox should be injected Left or Right. 
	 *
	 */
	_addTextBoxToTheatreBar(
		textBox: HTMLElement,
		isLeft: boolean = false) {

		let textBoxes = this.stage.getTextBoxes();
		let primeBar = this.stage.primeBar;
		let secondBar = this.stage.secondBar;

		if (textBoxes.length == 0) {
			// no dock
			// 1. slide in prime container, add textBox to it
			primeBar.appendChild(textBox);
			primeBar.style.left = "0%";
			primeBar.style.opacity = "1";
			primeBar.style.setProperty("pointer-events", "all");
			this.stage.theatreBar.style.opacity = "1";
			Hooks.call("theatreDockActive", this.dockActive);
		} else if (textBoxes.length == 1) {
			// single dock
			// 1. slide in second container, and add new textBox to it
			let insert = this.stage.getInsertById(textBox.getAttribute("imgId"));
			if (insert) {
				//insert.meta.fromPrime = true;
				insert.nameOrientation = "right";
			}

			let dualWidth = Math.min(Math.floor(this.stage.theatreBar.offsetWidth / 2), 650);
			secondBar.style.left = `calc(100% - ${dualWidth}px)`;
			secondBar.style.opacity = "1";
			secondBar.style.setProperty("pointer-events", "all");
			secondBar.style.width = `${dualWidth}px`;
			primeBar.style.width = `${dualWidth}px`;

			secondBar.appendChild(textBox);
			Hooks.call("theatreDockActive", this.dockActive);
		} else if (textBoxes.length == 2) {
			// dual docks
			// 1. confirm if we're in dual dock mode
			// 2. if in dual dock mode, slide away the right dock
			// container, and remove any inserts that are not in
			// the 'prime' dock, and add them to the prime dock (should be one)
			// 3. expand the prime dock to fit the max bar width
			for (let sbb of secondBar.children) {
				let insert = this.stage.getInsertById(sbb.getAttribute("imgId"));
				if (insert) {
					//insert.meta.fromSecond = true;
					insert.nameOrientation = "left";
				}
				primeBar.appendChild(sbb);
			}
			secondBar.style.left = "200%";
			secondBar.style.opacity = "0";
			secondBar.style.setProperty("pointer-events", "none");
			primeBar.style.width = "100%";

			if (isLeft) KHelpers.insertBefore(textBox, primeBar.children[0]);
			else primeBar.appendChild(textBox);
			Hooks.call("theatreDockActive", this.dockActive);

		} else if (textBoxes.length > 2) {
			// bar dock
			// 1. Just find the prime container, and add the new textBox to it
			if (isLeft) KHelpers.insertBefore(textBox, primeBar.children[0]);
			else primeBar.appendChild(textBox);
			Hooks.call("theatreDockActive", this.dockActive);

		}
	}

	/**
	 * Remove a textBox from the theatreBar
	 *
	 * @param textBox (HTMLElement : div) : the textBox to add to the theatreBar,
	 *									  MUST correspond to an insert. 
	 */
	_removeTextBoxFromTheatreBar(textBox: HTMLElement) {
		let textBoxes = this.stage.getTextBoxes();
		let primeBar = this.stage.primeBar;
		let secondBar = this.stage.secondBar;

		if (textBoxes.length == 0) {
			// no dock
			// Should be impossible
			console.log("REMOVE TEXTBOX ERROR, NO TEXTBOXES", textBox, this.stage.theatreBar);
		} else if (textBoxes.length == 1) {
			// single dock
			// 1. Remove the text Box, and close the primary bar
			primeBar.style.left = "-100%";
			primeBar.style.opacity = "0";
			primeBar.style.setProperty("pointer-events", "none");
			textBox.parentNode.removeChild(textBox);
			this.stage.theatreBar.style.opacity = "0";
			Hooks.call("theatreDockActive", this.dockActive);
		} else if (textBoxes.length == 2) {
			// dual docks
			// 1. confirm if we're in dual dock mode
			// 2. if in dual dock mode, slide away the right dock
			// container, and remove any inserts that are not in
			// the 'prime' dock. If the element removed is the one we're removing,
			// then don't add it to the prime dock. If it isn't the one we're removing
			// then add the textBoxes in the 'secondary' dock to the primary.
			for (let sbb of secondBar.children) {
				if (sbb.getAttribute("imgId") != textBox.getAttribute("imgId")) {
					let insert = this.stage.getInsertById(sbb.getAttribute("imgId"));
					if (insert) {
						//insert.meta.fromSecond = true;
						insert.nameOrientation = "left";
					}
					primeBar.appendChild(sbb);
				}
			}
			secondBar.style.left = "200%";
			secondBar.style.opacity = "0";
			secondBar.style.setProperty("pointer-events", "none");
			primeBar.style.width = "750px";
			textBox.parentNode.removeChild(textBox);
			Hooks.call("theatreDockActive", this.dockActive);

		} else if (textBoxes.length == 3) {
			// bar dock
			// 1. create the dual docks 
			for (let idx = primeBar.children.length - 1; idx >= 0; --idx) {
				if (primeBar.children[idx].getAttribute("imgId") != textBox.getAttribute("imgId")) {
					let insert = this.stage.getInsertById(primeBar.children[idx].getAttribute("imgId"));
					if (insert) {
						//insert.meta.fromPrime = true;
						insert.nameOrientation = "right";
					}
					secondBar.appendChild(primeBar.children[idx]);
					break;
				}
			}
			let dualWidth = Math.min(Math.floor(this.stage.theatreBar.offsetWidth / 2), 650);
			secondBar.style.left = `calc(100% - ${dualWidth}px)`;
			secondBar.style.opacity = "1";
			secondBar.style.setProperty("pointer-events", "all");
			secondBar.style.width = `${dualWidth}px`;
			primeBar.style.width = `${dualWidth}px`;

			textBox.parentNode.removeChild(textBox);
			Hooks.call("theatreDockActive", this.dockActive);
		} else {
			// normal bar removal
			textBox.parentNode.removeChild(textBox);
			Hooks.call("theatreDockActive", this.dockActive);
		}
	}

	/**
	 * Given an image, path, attempt to inject it on the left
	 *
	 * @params imgPath (String) : The path to the image that will be used for the initial portrait. 
	 * @params portName (String) : The name that will be applied to the portrait's label.
	 * @params ImgId (String) : The theatreId that will be assigned to this insert (must be "theatre-<ID>")
	 * @params optAlign (String) : The alignment mode to use. Currently only "top" and "bottom" are accepted. 
	 * @params emotions (Object) : An Object containing the emote states to launch with. 
	 * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally. 
	 */
	injectLeftPortrait(
		imgPath: string,
		portName: string,
		imgId: string,
		optAlign: string,
		emotions: EmotionDefinition,
		remote: boolean = false) {
		if (this.stage.getInsertById(imgId)) {
			console.log('ID "%s" already exists! Refusing to inject %s', imgId, portName);
			return;
		}
		if (this.stage.stageInserts.length == 1) {
			// inject Right instread
			this.injectRightPortrait(imgPath, portName, imgId, optAlign, emotions, remote);
			return;
		}

		// activate in navbar if not already
		let navItem = this.getNavItemById(imgId);
		if (navItem)
			KHelpers.addClass(navItem, "theatre-control-nav-bar-item-active");

		this.workers.pixi_container_factory.createPortraitPIXIContainer(
			imgPath,
			portName,
			imgId,
			optAlign,
			emotions,
			true);

		let textBox = this.textBoxFactory.createTextbox(portName, imgId);

		// NOTE: we leave insert container positioning up to reorderInserts
		// which will fire when the loader processes it for injection
		this._addTextBoxToTheatreBar(textBox, true);

		// Push to socket our event
		if (!remote)
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.enterscene, { insertid: imgId, emotions: emotions, isleft: true });
	}

	/**
	 * Given an image, path, attempt to inject it on the right
	 *
	 * @params imgPath (String) : The path to the image that will be used for the initial portrait. 
	 * @params portName (String) : The name that will be applied to the portrait's label.
	 * @params ImgId (String) : The theatreId that will be assigned to this insert (must be "theatre-<ID>")
	 * @params optAlign (String) : The alignment mode to use. Currently only "top" and "bottom" are accepted. 
	 * @params emotions (Object) : An Object containing the emote states to launch with. 
	 * @params remote (Boolean) : Boolean indicating if this is being invoked remotely, or locally. 
	 */
	injectRightPortrait(
		imgPath: string,
		portName: string,
		imgId: string,
		optAlign: string,
		emotions: EmotionDefinition,
		remote: boolean = false) {
		if (this.stage.getInsertById(imgId)) {
			console.log('ID "%s" already exists! Refusing to inject %s', imgId, portName);
			return;
		}
		if (this.stage.stageInserts.length == 0) {
			// inject Left instread
			this.injectLeftPortrait(imgPath, portName, imgId, optAlign, emotions, remote);
			return;
		}

		// activate in navbar if not already
		let navItem = this.getNavItemById(imgId);
		if (navItem)
			KHelpers.addClass(navItem, "theatre-control-nav-bar-item-active");

		this.workers.pixi_container_factory.createPortraitPIXIContainer(
			imgPath,
			portName,
			imgId,
			optAlign,
			emotions,
			false);

		let textBox = this.textBoxFactory.createTextbox(portName, imgId);

		this._addTextBoxToTheatreBar(textBox);

		// Push to socket our event
		if (!remote)
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.enterscene, { insertid: imgId, emotions: emotions, isleft: false });
	}

	/**
	 * If the dock is active, a number > 0 will be returned indicating
	 * the number of active Theatre Inserts in the dock. 0 meaning the dock
	 * is inactive
	 *
	 * @return (Number) : The number of inserts in the dock
	 */
	get dockActive() {
		return this.stage.stageInserts.length;
	}

	/**
	 * Get nav item by ID
	 *
	 * @params id (String) : The theatreId insert whose navItem we want. 
	 *
	 * @return (HTMLElement) : The nav item, if found, else undefined. 
	 */
	getNavItemById(id: string): HTMLElement {
		const theatreActor = this.stage.actors.get(id);
		if (theatreActor)
			return theatreActor.navElement;

		return undefined
	}

	/**
	 * Get nav item by Name
	 *
	 * @params name (String) : The label name of the insert whose navItem we want. 
	 *
	 * @return (HTMLElement) : The nav item, if found, else undefined. 
	 */
	getNavItemByName(name: string): HTMLElement {
		for (let navItem of this.theatreControls.theatreNavBar.children) {
			if (navItem.getAttribute("name") == name)
				return <HTMLElement>navItem;
		}
		return undefined;
	}

	/**
	 * Get bar text box by ID
	 *
	 * @params id (String) : The theatreId of an insert whose textBox we want.
	 *
	 * @return (HTMLElement) : The TextBox of the given theatreId, or undefined. 
	 */
	getTextBoxById(id: string): HTMLElement {
		// Narrator is a special case
		if (id == Theatre.NARRATOR)
			return <HTMLElement>this.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
		for (let textBox of this.stage.getTextBoxes()) {
			if (textBox.getAttribute("imgId") == id) {
				return textBox;
			}
		}

		return undefined;
	}

	/**
	 * Get bar text box by Name
	 *
	 * @params name (String) : The label name of an insert whose textBox we want.
	 *
	 * @return (HTMLElement) : The TextBox of the given theatreId, or undefined. 
	 */
	getTextBoxByName(name: string): HTMLElement {
		if (name == Theatre.NARRATOR)
			return <HTMLElement>this.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
		for (let textBox of this.stage.getTextBoxes()) {
			if (textBox.getAttribute("name") == name) {
				return textBox;
			}
		}

		return undefined
	}

	/**
	 * Get the label sprite given the insert
	 *
	 * @params insert (Object) : The Object representing the insert.
	 *
	 * @return (Object PIXIText) : The PIXIText label of the insert. 
	 *
	 */
	_getLabelFromInsert(insert: StageInsert): PIXI.Text {
		if (!insert || !insert.dockContainer) return null;
		return insert.label;
	}

	/**
	 * Gets the theatre's chat cover image
	 *
	 * @return (HTMLElement) : The <img> tag of the cover portrait in the
	 *	chat message area. 
	 */
	getTheatreCoverPortrait() {
		return this.theatreControls.theatreChatCover.getElementsByTagName("img")[0];
	}

	/**
	 * Get speaking insert of /this/ user
	 *
	 * @return (Object) : The Object representing the insert that this
	 *	User is speaking as, else undefined. 
	 */
	getSpeakingInsert() {
		let insert = this.stage.getInsertById(this.speakingAs);
		return insert;
	}

	/**
	 * Get speaking name of /this/ user
	 *
	 * @return (Object PIXISprite) : The PIXISrite label of the insert the
	 *	User is speaking as, else undefined. 
	 */
	getSpeakingLabel() {
		let insert = this.stage.getInsertById(this.speakingAs);
		return this._getLabelFromInsert(insert);
	}

	/**
	 * Get speaking textBox of /this/ user
	 *
	 * @return (HTMLElement) : The textBox of the insert the User is
	 *	speaking as, else undefined. 
	 */
	getSpeakingTextBox() {
		return this.stage.getTextBoxById(this.speakingAs);
	}


	/**
	 * Swap Inserts by ID
	 *
	 * @params id1 (String) : The theatreId of the first insert to swap.
	 * @params id2 (String) : The theatreId of the second insert to swap.
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	swapInsertsById(
		id1: string,
		id2: string,
		remote: boolean = false) {
		if (this.stage.stageInserts.length < 2) return;

		let insert1,
			insert2,
			textBox1,
			textBox2;
		for (let insert of this.stage.stageInserts) {
			if (insert.imgId == id1 && !insert1)
				insert1 = insert;
			else if (insert.imgId == id2 && !insert2)
				insert2 = insert;
			if (!!insert1 && !!insert2) break;
		}
		for (let textBox of this.stage.getTextBoxes()) {
			if (textBox.getAttribute("imgId") == id1 && !textBox1)
				textBox1 = textBox;
			else if (textBox.getAttribute("imgId") == id2 && !textBox2)
				textBox2 = textBox;
			if (!!textBox1 && !!textBox2) break;
		}

		if (!insert1 || !insert2) return;
		if (!textBox1 || !textBox2) return;

		this._swapInserts(
			insert1,
			insert2,
			textBox1,
			textBox2,
			remote);
	}

	/**
	 * Swap Inserts by Name
	 *
	 * @params name1 (String) : The label name of the first insert to swap.
	 * @params name2 (String) : The label name of the second insert to swap.
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	swapInsertsByName(
		name1: string,
		name2: string,
		remote: boolean = false) {
		if (this.stage.stageInserts.length < 2) return;

		let insert1,
			insert2,
			textBox1,
			textBox2;
		name1 = name1.toLowerCase();
		name2 = name2.toLowerCase();
		for (let insert of this.stage.stageInserts) {
			if (insert.name == name1 && !insert1)
				insert1 = insert;
			else if (insert.name == name2 && !insert2)
				insert2 = insert;
			if (!!insert1 && !!insert2) break;
		}
		for (let textBox of this.stage.getTextBoxes()) {
			if (textBox.getAttribute("name") == name1 && !textBox1)
				textBox1 = textBox;
			else if (textBox.getAttribute("name") == name2 && !textBox2)
				textBox2 = textBox;
			if (!!textBox1 && !!textBox2) break;
		}

		if (!insert1 || !insert2) return;
		if (!textBox1 || !textBox2) return;

		this._swapInserts(
			insert1,
			insert2,
			textBox1,
			textBox2,
			remote);
	}

	/**
	 * Swaps Inserts
	 *
	 * @param insert1 (Object) : The Object representing the first insert to swap. 
	 * @param insert2 (Object) : The Object representing the second insert to swap. 
	 * @param textBox1 (HTMLELement) : The textBox of the first insert to swap.
	 * @param textBox2 (HTMLELement) : The textBox of the second insert to swap.
	 * @param remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 *
	 */
	_swapInserts(
		insert1: StageInsert,
		insert2: StageInsert,
		textBox1: HTMLElement,
		textBox2: HTMLElement,
		remote: boolean = false) {
		let tsib1n = textBox1.nextSibling,
			tsib1p = textBox1.previousSibling,
			tsib2n = textBox2.nextSibling,
			tsib2p = textBox2.previousSibling;
		//console.log("SWAP",textBox1,textBox2); 
		let adjSwap = false;

		// permission check
		if (!remote && (!this.isPlayerOwned(insert1.imgId) || !this.isPlayerOwned(insert2.imgId))) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotSwapControlled"));
			return;
		} else if (!remote && (!this.isActorOwner(game.user.id, insert1.imgId) && !this.isActorOwner(game.user.id, insert2.imgId))) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotSwapOwner"));
			return;
		}


		// check the dual dock case
		if (this._isTextBoxInPrimeBar(textBox1) && this._isTextBoxInSecondBar(textBox2)) {
			let primeBar = this.stage.primeBar;
			let secondBar = this.stage.secondBar;
			insert1.nameOrientation = "right";
			insert1.exitOrientation = "right";
			insert2.nameOrientation = "left";
			insert2.exitOrientation = "left";

			primeBar.appendChild(textBox2);
			secondBar.appendChild(textBox1);
		} else if (this._isTextBoxInPrimeBar(textBox2) && this._isTextBoxInSecondBar(textBox1)) {
			let primeBar = this.stage.primeBar;
			let secondBar = this.stage.secondBar;
			insert1.nameOrientation = "left";
			insert1.exitOrientation = "left";
			insert2.nameOrientation = "right";
			insert2.exitOrientation = "right";

			primeBar.appendChild(textBox1);
			secondBar.appendChild(textBox2);
		} else {
			// full bar case
			if (tsib1n) KHelpers.insertBefore(textBox2, tsib1n);
			else if (tsib1p && (tsib1p != textBox2)) KHelpers.insertAfter(textBox2, tsib1p);
			else {
				if (Theatre.DEBUG) console.log("NO TSIB1 and PRIOR");
				KHelpers.insertAfter(textBox2, textBox1);
				adjSwap = true;
			}

			if (!adjSwap) {
				if (tsib2n) KHelpers.insertBefore(textBox1, tsib2n);
				else if (tsib2p && (tsib2p != textBox1)) KHelpers.insertAfter(textBox1, tsib2p);
				else {
					if (Theatre.DEBUG) console.log("NO TSIB2 and PRIOR");
					KHelpers.insertAfter(textBox1, textBox2);
				}
			}
		}

		if (this.reorderTOId)
			window.clearTimeout(this.reorderTOId);

		this.reorderTOId = window.setTimeout(() => {
			this.insertReorderer.reorderInserts();
			this.reorderTOId = null;
		}, 250);

		// Push to socket our event
		if (!remote) {
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.swap, {
				insertid1: insert1.imgId,
				insertid2: insert2.imgId,
			});
		}
	}

	/**
	 * Move  Inserts by ID
	 *
	 * @param id1 (String) : The theatreId of the destination insert to move to.
	 * @param id2 (String) : The theatreId of insert to move.
	 * @param remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	moveInsertById(
		id1: string,
		id2: string,
		remote: boolean = false) {
		if (this.stage.stageInserts.length < 2) return;

		let insert1,
			insert2,
			textBox1,
			textBox2;
		for (let insert of this.stage.stageInserts) {
			if (insert.imgId == id1 && !insert1)
				insert1 = insert;
			else if (insert.imgId == id2 && !insert2)
				insert2 = insert;
			if (!!insert1 && !!insert2) break;
		}
		for (let textBox of this.stage.getTextBoxes()) {
			if (textBox.getAttribute("imgId") == id1 && !textBox1)
				textBox1 = textBox;
			else if (textBox.getAttribute("imgId") == id2 && !textBox2)
				textBox2 = textBox;
			if (!!textBox1 && !!textBox2) break;
		}

		if (!insert1 || !insert2) return;
		if (!textBox1 || !textBox2) return;
		this._moveInsert(insert1, insert2, textBox1, textBox2, remote);
	}

	/**
	 * Move an insert
	 *
	 * @param insert1 (Object) : The Object representing the destination insert. 
	 * @param insert2 (Object) : The Object representing insert to move
	 *
	 * @param textBox1 (HTMLELement) : The textBox of the destination textbox
	 * @param textBox2 (HTMLELement) : The textBox of the textbox to move
	 *
	 * @param remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 *
	 */
	_moveInsert(
		insert1: StageInsert,
		insert2: StageInsert,
		textBox1: HTMLElement,
		textBox2: HTMLElement,
		remote: boolean = false) {

		// permission check
		if (!remote && !this.isActorOwner(game.user.id, insert2.imgId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotMoveOwner"));
			return;
		} else if (!remote && (!this.isPlayerOwned(insert1.imgId) || !this.isPlayerOwned(insert2.imgId))) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotMoveControlled"));
			return;
		}

		// check the dual dock case
		if (this._isTextBoxInPrimeBar(textBox1) && this._isTextBoxInSecondBar(textBox2)) {
			let primeBar = this.stage.primeBar;
			let secondBar = this.stage.secondBar;
			insert1.nameOrientation = "right";
			insert1.exitOrientation = "right";
			insert2.nameOrientation = "left";
			insert2.exitOrientation = "left";

			primeBar.appendChild(textBox2);
			secondBar.appendChild(textBox1);
		} else if (this._isTextBoxInPrimeBar(textBox2) && this._isTextBoxInSecondBar(textBox1)) {
			let primeBar = this.stage.primeBar;
			let secondBar = this.stage.secondBar;
			insert1.nameOrientation = "left";
			insert1.exitOrientation = "left";
			insert2.nameOrientation = "right";
			insert2.exitOrientation = "right";

			primeBar.appendChild(textBox1);
			secondBar.appendChild(textBox2);
		} else {
			// full bar case
			if (insert2.order > insert1.order)
				KHelpers.insertBefore(textBox2, textBox1);
			else
				KHelpers.insertAfter(textBox2, textBox1);
		}

		if (this.reorderTOId)
			window.clearTimeout(this.reorderTOId);

		this.reorderTOId = window.setTimeout(() => {
			this.insertReorderer.reorderInserts();
			this.reorderTOId = null;
		}, 250);

		// Push to socket our event
		if (!remote) {
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.move, {
				insertid1: insert1.imgId,
				insertid2: insert2.imgId,
			});
		}
	}


	/**
	 * Is the textbox in the prime bar
	 *
	 * @params textBox (HTMLElement) : The textBox to check. 
	 *
	 * @return (Boolean) True if the textBox is in the Prime Bar, false otherwise. 
	 *
	 * @private
	 */
	_isTextBoxInPrimeBar(textBox: HTMLElement): boolean {
		let primeBar = this.stage.primeBar;
		let id = textBox.getAttribute("imgId");
		for (let btb of primeBar.children) {
			if (btb.getAttribute("imgId") == id)
				return true;
		}
		return false;
	}

	/**
	 * Is the textbox in the second bar
	 *
	 * @params textBox (HTMLElement) : The textBox to check. 
	 *
	 * @return (Boolean) True if the textBox is in the Second Bar, false otherwise. 
	 *
	 * @private
	 */
	_isTextBoxInSecondBar(textBox: HTMLElement): boolean {
		let secondBar = this.stage.secondBar;
		let id = textBox.getAttribute("imgId");
		for (let btb of secondBar.children) {
			if (btb.getAttribute("imgId") == id)
				return true;
		}
		return false;
	}

	/**
	 * Push Insert left or right of all others by Id
	 *
	 * @params id (String) : The theatreId of the insert to push.
	 * @params isLeft (Boolean) : Wether we're pushing left or right.
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	pushInsertById(
		id: string,
		isLeft: boolean,
		remote: boolean = false) {
		if (this.stage.stageInserts.length <= 2) return;

		let targInsert;
		let targTextBox;
		for (let insert of this.stage.stageInserts) {
			if (insert.imgId == id) {
				targInsert = insert;
				break;
			}
		}
		for (let textBox of this.stage.getTextBoxes()) {
			if (textBox.getAttribute("imgId") == id) {
				targTextBox = textBox;
				break;
			}
		}
		if (!targInsert || !targTextBox) return;

		this._pushInsert(targInsert, targTextBox, isLeft, remote);
	}

	/**
	 * Push Insert left or right of all others by Name
	 *
	 * @param name (String) : The label name of the insert to push.
	 * @param isLeft (Boolean) : Wether we're pushing left or right.
	 * @param remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	pushInsertByName(
		name: string,
		isLeft: boolean,
		remote: boolean = false) {
		if (this.stage.stageInserts.length <= 2) return;

		let targInsert;
		let targTextBox;
		for (let insert of this.stage.stageInserts) {
			if (insert.name == name) {
				targInsert = insert;
				break;
			}
		}
		for (let textBox of this.stage.getTextBoxes()) {
			if (textBox.getAttribute("name") == name) {
				targTextBox = textBox;
				break;
			}
		}
		if (!targInsert || !targTextBox) return;

		this._pushInsert(targInsert, targTextBox, isLeft, remote);
	}

	/**
	 * Push Insert left or right of all others
	 *
	 * @params insert (Object) : The Object represeting the insert. 
	 * @params textBox (HTMLElement) : The textBox of the insert. 
	 * @params isLeft (Boolean) : Wether we're pushing left or right. 
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 *
	 */
	_pushInsert(
		insert: StageInsert,
		textBox: HTMLElement,
		isLeft: boolean,
		remote: boolean = false) {

		let textBoxes = this.stage.getTextBoxes();
		let firstInsert = this.stage.stageInserts[0];
		let lastInsert = this.stage.stageInserts[this.stage.stageInserts.length - 1];
		let firstTextBox = textBoxes[0];
		let lastTextBox = textBoxes[textBoxes.length - 1];

		if (!firstInsert || !lastInsert || !firstTextBox || !lastTextBox) return;

		// permission check
		if (!remote && !this.isActorOwner(game.user.id, insert.imgId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return;
		} else if (!remote && (isLeft ? !this.isPlayerOwned(firstInsert.imgId) : !this.isPlayerOwned(lastInsert.imgId))) {
			if (isLeft)
				ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotPushFront"));
			else
				ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.CannotPushBack"));
			return;
		}

		if (isLeft) {
			KHelpers.insertBefore(textBox, firstTextBox);
		} else {
			KHelpers.insertAfter(textBox, lastTextBox);
		}

		this.insertReorderer.reorderInserts();

		// Push to socket our event
		if (!remote) {
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.push, {
				insertid: insert.imgId,
				tofront: isLeft
			});
		}
	}

	/**
	 * Mirror a portrait by ID
	 *
	 * @params id (String) : The theatreId of the insert we wish to mirror. 
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	mirrorInsertById(
		id: string,
		remote: boolean = false): void {
		let insert = this.stage.getInsertById(id);
		if (!insert) return;

		this._mirrorInsert(insert, remote);
	}

	/**
	 * Mirror a portrait by Name
	 *
	 * @params name (String) : The label name of the insert we wish to mirror. 
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	mirrorInsertByName(
		name: string,
		remote: boolean = false) {

		let insert = this.stage.getInsertByName(name);
		if (!insert) return;

		this._mirrorInsert(insert, remote);
	}

	/**
	 * Is an insertMirrored give Id
	 *
	 * @params id (String) : The theatreId of the insert we wish to mirror. 
	 * return (Boolean) : True if the insert is mirrored, false otherwise.
	 */
	isInsertMirrored(id: string): boolean {
		let insert = this.stage.getInsertByName(id);
		return insert.mirrored;
	}

	/**
	 * Mirror a portrait
	 *
	 * @params insert (Object) : The Object represeting the insert.
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 *
	 * @private
	 */
	_mirrorInsert(
		insert: StageInsert,
		remote: boolean = false) {
		// permission check
		if (!remote && (!this.isActorOwner(game.user.id, insert.imgId))) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return;
		}

		let tweenId = "mirrorFlip";
		let broadcast = false;
		if (!insert.mirrored && !insert.tweens[tweenId]) {
			insert.mirrored = true;
			let tween = TweenMax.to(insert.portrait, 0.5, {
				scaleX: -1,
				ease: Power4.easeInOut,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId, this, tweenId);
				},
				onCompleteParams: [this, insert.imgId, tweenId],
			});
			this._addDockTween(insert.imgId, tween, tweenId);
			broadcast = true;
		} else if (!insert.tweens[tweenId]) {
			insert.mirrored = false;
			let tween = TweenMax.to(insert.portrait, 0.5, {
				scaleX: 1,
				ease: Power4.easeInOut,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId, this, tweenId);
				},
				onCompleteParams: [this, insert.imgId, tweenId],
			});
			this._addDockTween(insert.imgId, tween, tweenId);
			broadcast = true;
		}

		// Push to socket our event
		if (!remote && broadcast) {
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.positionupdate, {
				insertid: insert.imgId,
				position: {
					x: insert.x,
					y: insert.y,
					mirror: insert.mirrored
				}
			});
		}

	}

	/**
	 * Reset an insert's postion/mirror state by Id
	 *
	 * @param id : The theatreId of the insert to reset.
	 * @optional @param: Wether this is being invoked remotely, or locally. 
	 */
	resetInsertById(
		id: string,
		remote: boolean = false) {
		let insert = this.stage.getInsertById(id);

		this._resetPortraitPosition(insert, remote);
	}

	/**
	 * Reset an insert's postion/mirror state by Id
	 *
	 * @param name (String) : The name label of the insert to reset.
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	resetInsertByName(
		name: string,
		remote: boolean = false) {
		let insert = this.stage.getInsertByName(name);

		this._resetPortraitPosition(insert, remote);
	}
	/**
	 * Resets a portrait position/morror state
	 *
	 * @params insert (Object) : The Object represeting an insert.
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 *
	 * @private
	 */
	_resetPortraitPosition(
		insert: StageInsert,
		remote: boolean = false) {
		// permission check
		if (!remote && !this.isActorOwner(game.user.id, insert.imgId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return;
		}

		let tweenId, tween;
		// reset mirroring
		// reset position of portraitContainer
		insert.mirrored = false;
		tweenId = "portraitMove";
		tween = TweenMax.to(insert.portrait, 0.5, {
			scaleX: 1,
			x: 0,
			y: 0,
			ease: Power3.easeOut,
			onComplete: function (ctx, imgId, tweenId) {
				// decrement the rendering accumulator
				if (Theatre.DEBUG) console.log("portrait move onComplete %s", tweenId);
				ctx._removeDockTween(imgId, this, tweenId);
			},
			onCompleteParams: [this, insert.imgId, tweenId]
		});
		this._addDockTween(insert.imgId, tween, tweenId);

		// Push to socket our event
		if (!remote) {
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.positionupdate, {
				insertid: insert.imgId,
				position: { x: insert.portrait.width / 2, y: insert.portrait.height / 2, mirror: false }
			});
		}

	}

	/**
	 * first verify, then immediately execute the set of tweens
	 * defined in the animation syntax. 
	 *
	 * If any tweens in the syntax are incorrect, none are executed, and
	 * an empty array is returned indicating no tweens were performed
	 *
	 * Return an array of tweens applied to the target container
	 *
	 * @params animName (String) : The animation name.
	 * @params animSyntax (String) : The animation syntax.
	 * @params resMap (Array[Object]) : The resource map to use consisting of
	 *								  {name: (String), path: (String)} tuples. 
	 * @param {StageInsert} insert :  The object represeting the insert that will contain this
	 *							animation. 
	 */
	addTweensFromAnimationSyntax(
		animName: string,
		animSyntax: string,
		resMap: RiggingResource[],
		insert: StageInsert) {
		let tweenParams = AnimationSyntaxVerifier.verifyAnimationSyntax(animSyntax);

		let resTarget = resMap.find(e => (e.name == tweenParams[0].resName));
		let resource = PIXI.Loader.shared.resources[resTarget.path];

		if (Theatre.DEBUG) console.log("Adding tweens for animation '%s' from syntax: %s with params: ", animName, animSyntax, tweenParams);
		//console.log("Resource path is %s, resource: ", resTarget.path, resource); 
		if (!resource) {
			console.log('ERROR: resource name : "%s" with path "%s" does not exist!', tweenParams[0].resName, resTarget.path);
			return;
		}

		const sprite = new PIXI.Sprite(resource.texture);
		sprite.anchor.set(0.5);
		insert.portrait.addEmote(sprite);

		for (let idx = 0; idx < tweenParams.length; ++idx) {

			let advOptions = tweenParams[idx].advOptions;
			// advanced options breakdown
			let yoyo = null;
			let delay = 0;
			let repeat = 0;
			let repeatDelay = 0;
			let ease = Power0.easeNone;
			let yoyoEase = null;
			let noMirror = false; // Not Implemented
			if (advOptions) {
				if (Theatre.DEBUG) console.log("adv options arg: ", advOptions);
				yoyo = advOptions.yoyo ? true : false;
				noMirror = advOptions.noMirror ? true : false;
				delay = advOptions.delay ? Number(advOptions.delay) : delay;
				repeat = advOptions.repeat ? Number(advOptions.repeat) : repeat;
				repeatDelay = advOptions.repeatDelay ? Number(advOptions.repeatDelay) : repeatDelay;
				ease = advOptions.ease ? EaseVerifier.verifyEase(advOptions.ease) : ease;
				yoyoEase = advOptions.yoyoEase ? EaseVerifier.verifyEase(advOptions.yoyoEase) : yoyoEase;
			}

			let pixiParams = {};
			for (let prop of tweenParams[idx].props) {
				// special case of x/y/scale
				if (prop.name == "x"
					|| prop.name == "y"
					|| prop.name == "rotation"
					|| prop.name == "scaleX"
					|| prop.name == "scaleY") {
					if ((prop.initial as string).includes("%")) {
						prop.initial = Number((prop.initial as string).match(/-*\d+\.*\d*/)[0] || 0) / 100
							* (prop.name == "x" ? insert.portrait.width : insert.portrait.height);
						prop.final = Number((prop.final as string).match(/-*\d+\.*\d*/)[0] || 0) / 100
							* (prop.name == "x" ? insert.portrait.width : insert.portrait.height);
					} else if (["scaleX", "scaleY", "rotation"].some(e => e == prop.name)) {
						prop.initial = Number((prop.initial as string).match(/-*\d+\.*\d*/)[0] || 0);
						prop.final = Number((prop.final as string).match(/-*\d+\.*\d*/)[0] || 0);
					}
					if (Theatre.DEBUG) console.log("new %s : %s,%s : w:%s,h:%s", prop.name, prop.initial, prop.final, insert.portrait.width, insert.portrait.height);
				}

				// special case for some GSAP -> PIXI names
				switch (prop.name) {
					case "scaleX":
						sprite.scale.x = prop.initial as number;
						break;
					case "scaleY":
						sprite.scale.y = prop.initial;
						break;
					case "rotation":
						sprite.rotation = (prop.initial as number) * (Math.PI / 180);
						break;
					default:
						sprite[prop.name] = prop.initial;
						break;
				}
				pixiParams.setProperty(prop.name, prop.final);
			}

			let tweenId = animName + idx;
			let tween = TweenMax.to(sprite, tweenParams[idx].duration, {
				pixi: pixiParams,
				ease: ease,
				delay: delay,
				repeatDelay: repeatDelay,
				repeat: repeat,
				yoyo: yoyo,
				yoyoEase: yoyoEase,
				/*onRepeat: function() {
					console.log("ANIMATION tween is repeating!",this); 
				}, */
				onComplete: function (ctx, imgId, tweenId) {
					if (Theatre.DEBUG) console.log("ANIMATION tween complete!");
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [this, insert.imgId, tweenId]
			});
			if (repeat != 0)
				tween.duration(tweenParams[idx].duration);
			this._addDockTween(insert.imgId, tween, tweenId);

		}
	}

	/**
	 * Given the insert params, return the correct
	 * intitial emotion set when displaying an insert
	 * which was previously staged, or not active
	 *
	 * first : actor.data.flags.theatre.<emote>.settings.<parameter>
	 * second : actor.data.flags.theatre.settings.<parameter>
	 * third : Theatre.instance.userEmotes[<userid>].<parameter>
	 *
	 * @params params (Object) : The set of emotion properties.
	 * @params userDefault (Boolean) : Wether to use the default user settings over the
	 *								 settings in the params object. 
	 *
	 * @return (Object) : The object containing the emotion properties to be used. 
	 *
	 */
	_getInitialEmotionSetFromInsertParams(params, useDefault) {
		if (Theatre.DEBUG) console.log("use default? %s", !useDefault);

		const emotes = this.userEmotes.get(game.user.id);

		let emotions = {
			emote: (!useDefault && params.settings.emote ? params.settings.emote : null)
				|| (emotes ? emotes.emote : null),
			textFlyin: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings
				? params.emotes[params.settings.emote].settings.textflyin : null)
				|| (!useDefault ? params.settings.textflyin : null)
				|| (emotes ? emotes.textFlyin : null),
			textStanding: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings
				? params.emote.settings.textstanding : null)
				|| (!useDefault ? params.settings.textstanding : null)
				|| (emotes ? emotes.textStanding : null),
			textFont: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings
				? params.emote.settings.textfont : null)
				|| (!useDefault ? params.settings.textfont : null)
				|| (emotes ? emotes.textFont : null),
			textSize: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings
				? params.emote.settings.textsize : null)
				|| (!useDefault ? params.settings.textsize : null)
				|| (emotes ? emotes.textSize : null),
			textColor: (!useDefault && params.settings.emote && params.emotes[params.settings.emote] && params.emotes[params.settings.emote].settings
				? params.emote.settings.textcolor : null)
				|| (!useDefault ? params.settings.textcolor : null)
				|| (emotes ? emotes.textColor : null)
		}
		return emotions;
	}

	/**
	 * Activate an insert by Id, if it is staged to the navbar
	 *
	 * @params id (String) : The theatreId of the insert to activate.
	 * @params ev (Event) : The event that possibly triggered this activation. 
	 */
	activateInsertById(id, ev) {
		let actorId = id.replace("theatre-", "");
		let navItem = this.getNavItemById(id);
		if (!navItem) {
			let actor = game.actors.get(actorId);
			this.navBar.addToNavBar(actor.data);
			navItem = this.getNavItemById(id);
		}
		if (!navItem) return;


		let params = Tools.getInsertParamsFromActorId(actorId);

		if (Theatre.DEBUG) console.log(" set as active");
		// set as user active
		// If the insert does not exist in the dock, add it,
		// If it does, then simply toggle it as active if it isn't already
		// If it's already active, and we're GM, then we want to transition to 'god mode'
		// voice, thus we simply un-activate our character, and assume GM voice again
		// (the default, if no insert selected)
		let insert = this.stage.getInsertById(id);
		let textBox = this.getTextBoxById(id);
		let label = (insert ? insert.label : null);

		// remove old speaking as, shift it
		let oldSpeakingItem = this.getNavItemById(this.speakingAs);
		let oldSpeakingInsert = this.stage.getInsertById(this.speakingAs);
		let oldSpeakingLabel = (oldSpeakingInsert ? oldSpeakingInsert.label : null);
		if (oldSpeakingItem)
			KHelpers.removeClass(oldSpeakingItem, "theatre-control-nav-bar-item-speakingas");
		if (oldSpeakingInsert) {
			this._removeDockTween(this.speakingAs, null, "nameSpeakingPulse");
			oldSpeakingInsert.label.tint = 0xFFFFFF;
		}
		// if narrator is active, deactivate it and push the button up
		if (game.user.isGM && this.speakingAs == Theatre.NARRATOR)
			this.toggleNarratorBar(false);
		// if this insert / textbox pair is being removed, stop
		if (!!insert && textBox.getAttribute("deleting"))
			return;

		if (insert) {
			// already in theatre
			// if not same id toggle it
			let cimg = this.getTheatreCoverPortrait();
			if (this.speakingAs != id) {
				this.speakingAs = id;
				KHelpers.addClass(navItem, "theatre-control-nav-bar-item-speakingas");

				const navBar = this.theatreControls.theatreNavBar;

				TweenMax.to(
					navBar,
					.4,
					{
						scrollTo:
						{
							x: navItem.offsetLeft, offsetX: navBar.offsetWidth / 2
						}
					});

				// add label pulse
				insert.label.tint = 0xFFFFFF;
				let tweenId = "nameSpeakingPulse";
				let tween = TweenMax.to(insert.label, 1, {
					pixi: { tint: 0xFF6400 },
					ease: Power0.easeNone,
					repeat: -1,
					yoyo: true,
					onComplete: function (ctx, imgId, tweenId) {
						// decrement the rendering accumulator
						ctx._removeDockTween(imgId, this, tweenId);
						// remove our own reference from the dockContainer tweens
					},
					onCompleteParams: [this, id, tweenId]
				});
				this._addDockTween(id, tween, tweenId);

				// change cover
				cimg.setAttribute("src", params.src);
				cimg.style.width = `${this.theatreControls.theatreChatCover.offsetHeight}px`
				cimg.style.opacity = "0.3";
				// push focus to chat-message
				let chatMessage = document.getElementById("chat-message");
				chatMessage.focus();
				// send typing event
				//this._sendTypingEvent(); 
				//this.setUserTyping(game.user.id,this.speakingAs); 
			} else {
				this.speakingAs = null;
				// clear cover
				cimg.removeAttribute("src");
				cimg.style.opacity = "0";
				// clear typing theatreId data
				this.removeUserTyping(game.user.id);
				this.usersTyping.get(game.user.id).theatreId = null;
			}
		} else {
			let src = params.src;
			let name = params.name;
			let optAlign = params.optalign;
			let cimg = this.getTheatreCoverPortrait();
			let emotions;

			// determine if to launch with actor saves or default settings
			if (ev && ev.altKey)
				emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params, true);
			else
				emotions = Theatre.instance._getInitialEmotionSetFromInsertParams(params);

			if (Theatre.DEBUG) console.log("ACTIVATING AND INJECTING with Emotions: ", emotions);

			if (ev && !ev.shiftKey) {
				if (game.user.isGM)
					this.injectLeftPortrait(src, name, id, optAlign, emotions);
				else
					this.injectRightPortrait(src, name, id, optAlign, emotions);
			} else
				this.injectRightPortrait(src, name, id, optAlign, emotions);

			this.speakingAs = id;
			KHelpers.addClass(navItem, "theatre-control-nav-bar-item-speakingas");

			const navBar = this.theatreControls.theatreNavBar;

			TweenMax.to(
				navBar,
				.4,
				{
					scrollTo:
					{
						x: navItem.offsetLeft, offsetX: navBar.offsetWidth / 2
					}
				});

			window.setTimeout(() => {
				insert = this.stage.getInsertById(id);
				// if our insert hasn't been destroyed
				if (insert && !!insert.dockContainer && this.speakingAs == id) {
					label = this.label;
					// add label pulse
					insert.label.tint = 0xFFFFFF;
					let tweenId = "nameSpeakingPulse";
					let tween = TweenMax.to(insert.label, 1, {
						pixi: { tint: 0xFF6400 },
						ease: Power0.easeNone,
						repeat: -1,
						yoyo: true,
						onComplete: function (ctx, imgId, tweenId) {
							// decrement the rendering accumulator
							ctx._removeDockTween(imgId, this, tweenId);
							// remove our own reference from the dockContainer tweens
						},
						onCompleteParams: [this, id, tweenId]
					});
					this._addDockTween(id, tween, tweenId);
				}
			}, 1000);

			// change cover
			cimg.setAttribute("src", src);
			cimg.style.width = `${this.theatreControls.theatreChatCover.offsetHeight}px`
			cimg.style.opacity = "0.3";
			// push focus to chat-message
			let chatMessage = document.getElementById("chat-message");
			chatMessage.focus();
		}
		// send typing event
		this._sendTypingEvent();
		this.setUserTyping(game.user.id, this.speakingAs);
		// re-render the emote menu (expensive)
		this.emoteMenuRenderer.initialize();
	}

	/**
	 * immediately decays a textbox's contents by shifting them down, and
	 * fading it away
	 *
	 * @params theatreId (String) : The theatreId of the textBox we want to decay.
	 * @params remote (Boolean) : Wether this is being invoked remotely, or locally. 
	 */
	decayTextBoxById(theatreId, remote) {
		let insert = this.stage.getInsertById(theatreId);
		let textBox = this.stage.getTextBoxById(theatreId);
		if (!textBox || !insert) return;

		if (!remote && !this.isActorOwner(game.user.id, theatreId)) {
			ui.notifications.info(game.i18n.localize("Theatre.UI.Notification.DoNotControl"));
			return;
		}
		// clear last speaking if present
		KHelpers.removeClass(textBox, "theatre-text-box-lastspeaking");
		textBox.style.background = "";
		textBox.style["box-shadow"] = "";

		// clear decay Timout if present
		if (insert.decayTOId) {
			window.clearTimeout(insert.decayTOId);
			insert.decayTOId = null;
		}
		// kill tweens
		for (let c of textBox.children) {
			for (let sc of c.children)
				TweenMax.killTweensOf(sc);
			TweenMax.killTweensOf(c);
		}
		TweenMax.killTweensOf(textBox);

		// decay
		TweenMax.to(textBox.children, 0.5, {
			top: this.stage.theatreBar.offsetHeight / 2,
			opacity: 0,
			ease: Power0.easeNone,
			onComplete: function () {
				textBox.textContent = '';
			}
		});

		// Push to socket our event
		if (!remote) {
			this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.decaytext, { insertid: theatreId });
		}
	}

	/**
	 * Applies the player color to the textbox as 
	 * a box-shadow, and background highlight. 
	 *
	 * @params textBox (HTMLElement) : The textBox to apply the color to.
	 * @params userId (String) : The User's Id. 
	 * @params color (String) : The CSS color string to use if available. 
	 */
	applyPlayerColorToTextBox(textBox, userId, color) {
		//let user = game.users.get(userId); 
		//let userColor = user.color.replace("#",""); 
		color = color ? color.replace("#", "") : null || "FFFFFF";

		// break into radix
		let red = parseInt(color.substring(0, 2), 16);
		let green = parseInt(color.substring(2, 4), 16);
		let blue = parseInt(color.substring(4), 16);

		let darkred = Math.max(red - 50, 0);
		let darkgreen = Math.max(green - 50, 0);
		let darkblue = Math.max(blue - 50, 0);

		red = Math.min(red + 75, 255);
		green = Math.min(green + 75, 255);
		blue = Math.min(blue + 75, 255);

		if (Theatre.DEBUG) console.log("color %s : red: %s:%s, green %s:%s, blue %s:%s", color, red, darkred, green, darkgreen, blue, darkblue);

		// style specific settings
		switch (TheatreSettings.getTheatreStyle()) {
			case TheatreStyle.CLEARBOX:
				textBox.style.cssText += `background: linear-gradient(transparent 0%, rgba(${red},${green},${blue},0.30) 40%, rgba(${red},${green},${blue},0.30) 60%, transparent 100%); box-shadow: 0px 5px 2px 1px rgba(${darkred}, ${darkgreen}, ${darkblue}, 0.30)`;
				break;
			case TheatreStyle.MANGABUBBLE:
			case TheatreStyle.LIGHTBOX:
			case TheatreStyle.TEXTBOX:
			default:
				textBox.style.cssText += `background: linear-gradient(transparent 0%, rgba(${red},${green},${blue},0.10) 40%, rgba(${red},${green},${blue},0.10) 60%, transparent 100%); box-shadow: 0px 5px 2px 1px rgba(${darkred}, ${darkgreen}, ${darkblue}, .2)`;
				break;
		}

	}

	/**
	 * Gets the player 'flash' color that tints the insert as it 'pops.
	 *
	 * @params userId (String) : The User's Id. 
	 * @params color (String) : The CSS color string to use if available. 
	 *
	 * @return (String) : The CSS color to be used for the color flash. 
	 */
	getPlayerFlashColor(userId, color) {
		//let user = game.users.get(userId); 
		//let userColor = user.color.replace("#",""); 
		color = color ? color.replace("#", "") : null || "FFFFFF";

		// break into radix
		let red = parseInt(color.substring(0, 2), 16);
		let green = parseInt(color.substring(2, 4), 16);
		let blue = parseInt(color.substring(4), 16);

		// try to preserve ratios?
		red = Math.min(red + 75, 255);
		green = Math.min(green + 75, 255);
		blue = Math.min(blue + 75, 255);

		red = red.toString(16);
		green = green.toString(16);
		blue = blue.toString(16);

		if (Theatre.DEBUG) console.log(`#${red}${green}${blue}`);
		return `#${red}${green}${blue}`;
	}

	/**
	 * Apply the font family to the given element
	 *
	 * @params elem (HTMLElement) : The HTMLElement to apply the font family to.
	 * @params fontFamily (String) : The name of the font family to add. 
	 */
	applyFontFamily(elem, fontFamily) {
		elem.style["font-family"] = `"${fontFamily}", "SignikaBold", "Palatino Linotype", serif`;
		elem.style["font-weight"] = this.fontWeight;
	}

	/**
	 * Toggle the narrator bar
	 *
	 * @param active (Boolean) : Wether to activate or deactive the narrator bar.
	 * @param remote (Boolean) : Winter this is being invoked remotely, or locally. 
	 */
	toggleNarratorBar(
		active: boolean,
		remote: boolean = false) {

		if (active) {
			// spawn it
			let narratorBackdrop = this.theatreNarrator.getElementsByClassName("theatre-narrator-backdrop")[0];
			if (Theatre.DEBUG) console.log("NarratorBackdrop ", narratorBackdrop, this.theatreNarrator);
			narratorBackdrop.style.width = "100%";
			this.theatreNarrator.style.opacity = "1";
			this.isNarratorActive = true;
			// check if a navItem is active, if so, deactive it. 
			// set speakingAs to "narrator" note that this will need heavy regression testing
			// as it'll be plugging into the insert workflow when it's truely not a real insert
			if (game.user.isGM) {
				let btnNarrator = this.theatreControls.root.getElementsByClassName("theatre-icon-narrator")[0].parentNode;
				let oldSpeakingItem = this.getNavItemById(this.speakingAs);
				let oldSpeakingInsert = this.stage.getInsertById(this.speakingAs);
				let oldSpeakingLabel = this._getLabelFromInsert(oldSpeakingInsert);

				KHelpers.addClass(btnNarrator, "theatre-control-nav-bar-item-speakingas");
				if (oldSpeakingItem)
					KHelpers.removeClass(oldSpeakingItem, "theatre-control-nav-bar-item-speakingas");
				if (oldSpeakingInsert) {
					oldSpeakingInsert.label.tint = 0xFFFFFF;
					this._removeDockTween(this.speakingAs, null, "nameSpeakingPulse");
				}

				let textFlyin = this.theatreNarrator.getAttribute("textflyin");
				let textStanding = this.theatreNarrator.getAttribute("textstanding");
				let textFont = this.theatreNarrator.getAttribute("textfont");
				let textSize = this.theatreNarrator.getAttribute("textsize");
				let textColor = this.theatreNarrator.getAttribute("textcolor");

				const emotes = this.userEmotes.get(game.user.id);

				this.theatreNarrator.setAttribute("textflyin", textFlyin ? textFlyin
					: (emotes ? emotes.textFlyin : null))
				this.theatreNarrator.setAttribute("textstanding", textStanding ? textStanding
					: (emotes ? emotes.textStanding : null))
				this.theatreNarrator.setAttribute("textfont", textFont ? textFont
					: (emotes ? emotes.textFont : null))
				this.theatreNarrator.setAttribute("textsize", textSize ? textSize
					: (emotes ? emotes.textSize : null))
				this.theatreNarrator.setAttribute("textcolor", textColor ? textColor
					: (emotes ? emotes.textColor : null))

				let cimg = this.getTheatreCoverPortrait();
				// clear cover
				cimg.removeAttribute("src");
				cimg.style.opacity = "0";
				// clear typing theatreId data
				this.removeUserTyping(game.user.id);
				this.usersTyping.get(game.user.id).theatreId = null;
				// Mark speaking as Narrator
				this.speakingAs = Theatre.NARRATOR;
				this.setUserTyping(game.user.id, Theatre.NARRATOR);
				// push focus to chat-message
				let chatMessage = document.getElementById("chat-message");
				chatMessage.focus();
				// send event to triggier the narrator bar
				if (!remote)
					this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.narrator, { active: true });
				// re-render the emote menu (expensive)
				this.emoteMenuRenderer.initialize();
			}
		} else {
			// remove it
			let narratorBackdrop = this.theatreNarrator.getElementsByClassName("theatre-narrator-backdrop")[0];
			let narratorContent = this.theatreNarrator.getElementsByClassName("theatre-narrator-content")[0];
			if (Theatre.DEBUG) console.log("NarratorBackdrop ", narratorBackdrop, this.theatreNarrator);
			narratorBackdrop.style.width = "0%";
			this.theatreNarrator.style.opacity = "0";
			this.isNarratorActive = false;
			// kill animations
			for (let c of narratorContent.children) {
				for (let sc of c.children)
					TweenMax.killTweensOf(sc);
				TweenMax.killTweensOf(c);
			}
			for (let c of narratorContent.children)
				c.parentNode.removeChild(c);
			TweenMax.killTweensOf(narratorContent);
			narratorContent.style["overflow-y"] = "scroll";
			narratorContent.style["overflow-x"] = "hidden";

			if (Theatre.DEBUG) console.log("all tweens", TweenMax.getAllTweens());
			narratorContent.textContent = '';

			if (game.user.isGM) {
				let btnNarrator = this.theatreControls.root.getElementsByClassName("theatre-icon-narrator")[0].parentNode;
				KHelpers.removeClass(btnNarrator, "theatre-control-nav-bar-item-speakingas");
				// clear narrator
				this.speakingAs = null;
				this.removeUserTyping(game.user.id);
				this.usersTyping.get(game.user.id).theatreId = null;
				// send event to turn off the narrator bar
				if (!remote)
					this.sceneEventProcessor.sendSceneEvent(SceneEventTypes.narrator, { active: false });
				// re-render the emote menu (expensive)
				this.emoteMenuRenderer.initialize();
			}
		}

	}


	/**
	 * Handles
	 * - the window resize eventWindow was resized
	 * - SideBar collapse
	 */
	updateGeometry() {
		let sideBar = document.getElementById("sidebar");
		this.stage.theatreBar.style.width = (ui.sidebar._collapsed ? "100%" : `calc(100% - ${sideBar.offsetWidth + 2}px)`);
		this.theatreNarrator.style.width = (ui.sidebar._collapsed ? "100%" : `calc(100% - ${sideBar.offsetWidth + 2}px)`);
		let primeBar = this.stage.primeBar;
		let secondBar = this.stage.secondBar;
		if (this.stage.getTextBoxes().length == 2) {
			let dualWidth = Math.min(Math.floor(this.stage.theatreBar.offsetWidth / 2), 650);
			primeBar.style.width = dualWidth + "px";
			secondBar.style.width = dualWidth + "px";
			secondBar.style.left = `calc(100% - ${dualWidth}px)`;
		}
		// emote menu
		if (this.theatreControls.theatreEmoteMenu)
			this.theatreControls.theatreEmoteMenu.style.top = `${this.theatreControls.root.offsetTop - 410}px`


		this.stage.handleWindowResize()
		//app.render(); 
		if (!this.rendering)
			this._renderTheatre(performance.now());

		if (this.reorderTOId)
			window.clearTimeout(this.reorderTOId)

		this.reorderTOId = window.setTimeout(() => {
			this.insertReorderer.reorderInserts();
			this.reorderTOId = null;
		}, 250);

	}

	updateSuppression(suppress) {
		Theatre.instance.isSuppressed = suppress;

		let primeBar = this.stage.primeBar;
		let secondBar = this.stage.secondBar;
		let opacity = null

		if (Theatre.instance.isSuppressed) {

			opacity = game.settings.get(TheatreSettings.NAMESPACE, TheatreSettings.SUPPRESS_OPACITY)

			primeBar.style["pointer-events"] = "none";
			secondBar.style["pointer-events"] = "none";
		} else {

			opacity = "1"

			primeBar.style["pointer-events"] = "all";
			secondBar.style["pointer-events"] = "all";
		}

		this.stage.theatreDock.style.opacity = opacity;
		Theatre.instance.theatreBar.style.opacity = opacity;
		Theatre.instance.theatreNarrator.style.opacity = opacity;

		// call hooks
		Hooks.call("theatreSuppression", Theatre.instance.isSuppressed);
	}

	/**
	 *
	 * ActorSheet Configue Options
	 *
	 * @params ev (Event) : The event that triggered the configuration option.
	 * @params actorSheet (Object ActorSheet) : The ActorSheet Object to spawn a configure
	 *										  window from. 
	 */
	static onConfigureInsert(ev, actorSheet) {
		ev.preventDefault();
		if (Theatre.DEBUG) console.log("Click Event on Configure Theatre!!!", actorSheet, actorSheet.actor, actorSheet.position);

		if (!actorSheet.actor.data.flags.theatre) {
			actorSheet.actor.data.flags.theatre = { baseinsert: "", name: "" };
		}

		new TheatreActorConfig(actorSheet.actor, {
			top: actorSheet.position.top + 40,
			left: actorSheet.position.left + ((actorSheet.position.width - 500) / 2),
			configureDefault: true
		}).render(true);
	}

	/**
	 * Add to the nav bar staging area with an actorSheet.
	 *
	 * @params ev (Event) : The event that triggered adding to the NavBar staging area.
	 */
	onAddToNavBar(ev, actorSheet) {

		const removeLabelSheetHeader = TheatreSettings.getRemoteLabelSheetHeader();

		if (Theatre.DEBUG) console.log("Click Event on Add to NavBar!!", actorSheet, actorSheet.actor, actorSheet.position);
		const actorData = actorSheet.object.data;
		const addLabel = removeLabelSheetHeader ? "" : game.i18n.localize("Theatre.UI.Config.AddToStage");
		const removeLabel = removeLabelSheetHeader ? "" : game.i18n.localize("Theatre.UI.Config.RemoveFromStage");
		let newText;
		if (this.stage.isActorStaged(actorData)) {
			this.removeFromNavBar(actorData)
			newText = addLabel
		} else {
			this.navBar.addToNavBar(actorData);
			newText = removeLabel;
		}
		ev.currentTarget.innerHTML = this.stage.isActorStaged(actorData) ? `<i class="fas fa-theater-masks"></i>${newText}` : `<i class="fas fa-mask"></i>${newText}`;
	}



	/**
	 * Removes the actor from the nav bar.
	 *
	 * @params actor (Actor) : The actor to remove from the NavBar staging area. 
	 */
	removeFromNavBar(actor) {

		if (!actor)
			return;

		const theatreId = Tools.getTheatreId(actor);
		this.stage._removeFromStage(theatreId);

	}

	/**
	 * Removes the actor from the stage.
	 *
	 * @params id (string) : The theatreId to remove from the stage.
	 */
	_removeFromStage(theatreId) {
		const staged = this.stage.actors.get(theatreId);
		if (staged) {
			if (staged.navElement) {
				this.theatreControls.theatreNavBar.removeChild(staged.navElement);
			}
			this.stage.removeActorFromStage(theatreId)
		}
	}

	maybeUpdateNarratorHeight() {

		if (this.theatreNarrator)
			this.theatreNarrator.style.top = `calc(${TheatreSettings.getNarratorHeight} - 50px)`;
	}


}

