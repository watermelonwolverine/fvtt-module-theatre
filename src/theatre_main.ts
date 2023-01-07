/* eslint-disable no-unused-vars */
/* eslint-disable no-useless-escape */
/**
 * theatre_main.js
 *
 * Copyright (c) 2019 - 2020 Ken L.
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

import type StageInsert from "./components/stage/StageInsert";
import ActorExtensions from "./extensions/ActorExtensions";
import TheatreSettings from "./extensions/TheatreSettings";
import Theatre from "./Theatre";
import { SceneEventTypes } from "./types/SceneEventTypes";
import TextFlyinAnimationsFactory from "./workers/flyin_animations_factory";
import KHelpers from "./workers/KHelpers";
import TextStandingAnimationsFactory, { TextStandingAnimationFunction } from "./workers/standing_animations_factory";
import TextBoxToCharSplitter from "./workers/TextBoxToCharSplitter";

/**
 * Concat helper
 */
Handlebars.registerHelper("cat", function (arg1, arg2, hash) {
	let res = String(arg1) + String(arg2);
	return res;
});

/**
 * Given a string representing a property, resolve it as an actual property,
 * this is meant to be used in subexpressions rather than a final target
 */
Handlebars.registerHelper("resprop", function (propPath, hash) {
	let prop = getProperty(hash.data.root, propPath);
	return prop;
});

/**
 * Hook in on Actorsheet's Header buttons + context menus
 */
Hooks.on("getActorSheetHeaderButtons", (app: any, buttons: any) => {
	if (!game.user?.isGM && game.settings.get(TheatreSettings.NAMESPACE, "gmOnly")) return;

	let theatreButtons = [];
	if (app.object.isOwner) {
		// only prototype actors
		if (!app.object.token) {
			theatreButtons.push({
				label: "Theatre.UI.Config.Theatre",
				class: "configure-theatre",
				icon: "fas fa-user-edit",
				onclick: (ev: any) => Theatre.onConfigureInsert(ev, app.object.sheet),
			});
		}

		const removeLabelSheetHeader = TheatreSettings.getRemoteLabelSheetHeader();
		let label = Theatre.instance.stage.isActorStaged(app.object.data)
			? "Theatre.UI.Config.RemoveFromStage"
			: "Theatre.UI.Config.AddToStage";
		label = removeLabelSheetHeader ? "" : label;

		theatreButtons.push({
			label: label,
			class: "add-to-theatre-navbar",
			icon: "fas fa-theater-masks",
			onclick: (ev: any) => Theatre.instance.onAddToNavBar(ev, app.object.sheet),
		});
	}
	buttons.unshift(...theatreButtons);
});

/**
 * Sidebar collapse hook
 */
Hooks.on("collapseSidebar", function (a, collapsed) {
	Theatre.instance.updateGeometry();
});

/**
 * Pre-process chat message to set 'speaking as' to correspond
 * to our 'speaking as'
 */
Hooks.on("preCreateChatMessage", function (chatMessage: any) {
	let chatData = {
		speaker: <any>{},
		type: <any>{},
		content: <any>{},
	};
	// If theatre isn't even ready, then just no
	if (!Theatre.instance) {
		return;
	}
	// make the message OOC if needed
	if (
		!chatMessage.roll &&
		$(<HTMLDivElement>Theatre.instance.theatreControls.theatreChatCover).hasClass("theatre-control-chat-cover-ooc")
	) {
		const user = <User>game.users?.get(chatMessage.user.id);
		chatData.speaker.alias = user.name;
		chatData.speaker.actor = null;
		chatData.speaker.scene = null;
		chatData.type = CONST.CHAT_MESSAGE_TYPES.OOC;

		chatMessage.update(chatData);
		return;
	}

	if (!chatMessage.roll && Theatre.instance.speakingAs && Theatre.instance.usersTyping.get(chatMessage.user.id)) {
		let theatreId = <string>Theatre.instance.usersTyping.get(chatMessage.user.id)?.theatreId;
		let insert = Theatre.instance.stage.getInsertById(theatreId);
		let actorId = theatreId.replace("theatre-", "");

		if (insert && chatMessage.speaker) {
			let label = <PIXI.Text>Theatre.instance._getLabelFromInsert(insert);
			let name = label.text;

			chatData.speaker.alias = name;
			chatData.speaker.actor = null;
			chatData.speaker.scene = null;

			chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
			// if delay emote is active
			if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState == 1) {
				Theatre.instance.delayedSentState = 2;
				Theatre.instance.setUserEmote(
					<string>game.user?.id,
					theatreId,
					"emote",
					<any>insert.emotion.emote,
					false
				);
				Theatre.instance.delayedSentState = 0;
			}
		} else if (insert) {
			let label = <PIXI.Text>Theatre.instance._getLabelFromInsert(insert);
			let name = label.text;
			let theatreColor = Theatre.instance.getPlayerFlashColor(
				chatMessage.data.user.id,
				//@ts-ignore
				insert.textColor ? insert.textColor : <string>insert.emotion.textColor
			);
			chatData.speaker = {};
			chatData.speaker.alias = name;
			chatData.speaker.actor = null;
			chatData.speaker.scene = null;
			//chatData.flags.theatreColor = theatreColor;
			chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
			// if delay emote is active
			if (Theatre.instance.isDelayEmote && Theatre.instance.delayedSentState == 1) {
				Theatre.instance.delayedSentState = 2;
				Theatre.instance.setUserEmote(
					<string>game.user?.id,
					theatreId,
					"emote",
					<any>insert.emotion.emote,
					false
				);
				Theatre.instance.delayedSentState = 0;
			}
		} else if (Theatre.instance.speakingAs == Theatre.NARRATOR) {
			chatData.speaker = {};
			chatData.speaker.alias = game.i18n.localize("Theatre.UI.Chat.Narrator");
			chatData.speaker.actor = null;
			chatData.speaker.scene = null;
			chatData.type = CONST.CHAT_MESSAGE_TYPES.IC;
		}
	}
	// alter message data
	// append chat emote braces TODO make a setting
	if (
		Theatre.instance.isQuoteAuto &&
		!chatMessage.roll &&
		chatMessage.speaker &&
		(chatData.speaker.actor || chatData.speaker.token || chatData.speaker.alias) &&
		!chatMessage.data.content.match(/\<div.*\>[\s\S]*\<\/div\>/)
	) {
		chatData.content =
			game.i18n.localize("Theatre.Text.OpenBracket") +
			chatMessage.content +
			game.i18n.localize("Theatre.Text.CloseBracket");
	}

	chatMessage.data.update(chatData);
});

/**
 * Chat message Binding
 */
Hooks.on("createChatMessage", function (chatEntity: any, _: any, userId: string) {
	let theatreId: string | null = null;

	// If theatre isn't even ready, then just no
	if (!Theatre.instance) return;

	if (Theatre.instance.usersTyping.get(userId)) {
		theatreId = <string>Theatre.instance.usersTyping.get(userId)?.theatreId;
		Theatre.instance.removeUserTyping(userId);
	}

	// slash commands are pass through
	let chatData = chatEntity.data;
	if (
		chatData.content.startsWith("<") || //Bandaid fix so that texts that start with html formatting don't utterly break it
		chatData.content.startsWith("/") ||
		chatData.roll ||
		chatData.emote ||
		chatData.type == CONST.CHAT_MESSAGE_TYPES.OOC ||
		//|| Object.keys(chatData.speaker).length == 0
		chatData.content.match(/@[a-zA-Z0-9]+\[[a-zA-Z0-9]+\]/) ||
		chatData.content.match(/\<div.*\>[\s\S]*\<\/div\>/)
	)
		return;

	let textBox = Theatre.instance.getTextBoxById(<string>theatreId);
	let insert = <StageInsert>Theatre.instance.stage.getInsertById(<string>theatreId);
	let charSpans = [];
	let textContent = chatData.content;

	// replace entities
	textContent = textContent.replace(/&gt;/g, ">");
	textContent = textContent.replace(/&lt;/g, "<");
	textContent = textContent.replace(/&amp;/g, "&");
	textContent = textContent.replace(/<br>/g, "\n");

	if (textBox) {
		// kill all tweens
		for (let c of textBox.children) {
			for (let sc of c.children) {
				//TweenMax.killTweensOf(sc);
				gsap.killTweensOf(sc);
			}
			//TweenMax.killTweensOf(c);
			gsap.killTweensOf(c);
		}
		for (let c of textBox.children) {
			c.parentNode?.removeChild(c);
		}
		//TweenMax.killTweensOf(textBox);
		gsap.killTweensOf(textBox);
		textBox.style.overflowY = "scroll";
		textBox.style.overflowX = "hidden";

		textBox.textContent = "";

		if (insert) {
			// Highlight the most recent speaker's textBox
			let lastSpeaking = <HTMLCollectionOf<Element>>(
				Theatre.instance.stage.theatreBar?.getElementsByClassName("theatre-text-box-lastspeaking")
			);
			if (lastSpeaking[0]) {
				(<HTMLElement>lastSpeaking[0]).style.background = "";
				(<HTMLElement>lastSpeaking[0]).style.setProperty("box-shadow", "");
				KHelpers.removeClass(<HTMLElement>lastSpeaking[0], "theatre-text-box-lastspeaking");
			}
			KHelpers.addClass(textBox, "theatre-text-box-lastspeaking");
			Theatre.instance.applyPlayerColorToTextBox(textBox, userId, <string>insert.emotion.textColor);
			// Pump up the speaker's render order
			for (let dockInsert of Theatre.instance.stage.stageInserts) {
				dockInsert.renderOrder = dockInsert.order;
			}
			insert.renderOrder = 999999;
			Theatre.instance.stage.stageInserts.sort((a, b) => {
				return a.renderOrder - b.renderOrder;
			});
			// Pop our insert a little
			let tweenId = "portraitPop";
			if (!insert.portrait) {
				return;
			}
			//let tween = TweenMax.to(insert.portrait.root, 0.25, {
			let tween = gsap.to(insert.portrait.root, 0.25, {
				pixi: { scaleX: insert.mirrored ? -1.05 : 1.05, scaleY: 1.05 },
				ease: Power3.easeOut,
				repeat: 1,
				yoyo: true,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					let insert = Theatre.instance.stage.getInsertById(imgId);
					if (insert) {
						this.targets()[0].scale.x = insert.mirrored ? -1 : 1;
						this.targets()[0].scale.y = 1;
					}
					ctx._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
			});
			Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
			// Color flash
			tweenId = "portraitFlash";
			//tween = TweenMax.to(insert.portrait, 0.25, {
			tween = gsap.to(insert.portrait, 0.25, {
				//pixi:{tint: 0xAAEDFF},
				pixi: {
					tint: Theatre.instance.getPlayerFlashColor(userId, <string>insert.emotion.textColor),
				},
				ease: Power3.easeOut,
				repeat: 1,
				yoyo: true,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					this.targets()[0].tint = 0xffffff;
					ctx._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
			});
			Theatre.instance._addDockTween(insert.imgId, tween, tweenId);
		}

		let insertFlyinMode = "typewriter";
		let insertStandingMode: string | null = null;
		let insertFontType = null;
		let insertFontSize = null;
		let insertFontColor = null;
		if (insert) {
			insertFlyinMode = <string>insert.emotion.textFlyin;
			insertStandingMode = insert.emotion.textStanding;
			insertFontType = insert.emotion.textFont;
			insertFontSize = Number(insert.emotion.textSize);
			insertFontColor = insert.emotion.textColor;
		} else if (theatreId == Theatre.NARRATOR) {
			insertFlyinMode = <string>Theatre.instance.theatreNarrator.getAttribute("textflyin");
			insertStandingMode = Theatre.instance.theatreNarrator.getAttribute("textstanding");
			insertFontType = Theatre.instance.theatreNarrator.getAttribute("textfont");
			insertFontSize = Number(Theatre.instance.theatreNarrator.getAttribute("textsize"));
			insertFontColor = Theatre.instance.theatreNarrator.getAttribute("textcolor");
		}

		let fontSize = Number(textBox.getAttribute("osize") || 28);
		//console.log("font PRE(%s): ",insertFontSize,fontSize)
		switch (insertFontSize) {
			case 3:
				fontSize *= 1.5;
				break;
			case 1:
				fontSize *= 0.5;
				break;
			default:
				break;
		}
		Theatre.instance.applyFontFamily(textBox, insertFontType || Theatre.instance.textFont);
		//textBox.style["font-family"] = insertFontType || Theatre.instance.textFont;
		textBox.style.color = insertFontColor || "white";
		textBox.style.fontSize = `${fontSize}px`;
		textBox.scrollTop = 0;

		charSpans = TextBoxToCharSplitter.splitTextBoxToChars(textContent, textBox);

		TextFlyinAnimationsFactory.getForName(insertFlyinMode || "typewriter")(
			charSpans,
			0.5,
			0.05,
			<TextStandingAnimationFunction>TextStandingAnimationsFactory.getForName(<string>insertStandingMode)
		);

		// auto decay?
		if (insert && insert.decayTOId) window.clearTimeout(insert.decayTOId);
		if (insert && TheatreSettings.getAutoDecay()) {
			insert.decayTOId = window.setTimeout(
				(imgId: string) => {
					let insert = Theatre.instance.stage.getInsertById(imgId);
					if (insert) {
						Theatre.instance.decayTextBoxById(imgId, true);
					}
				},
				<number>(
					Math.max(TheatreSettings.getTextDecayRate() * charSpans.length, TheatreSettings.getTextDecayMin())
				),
				insert.imgId
			);
		}
	}
});

Hooks.on("renderChatLog", function (app: any, html: any, data: any) {
	if (data.cssId === "chat-popout") return;
	Theatre.instance.initialize();
	// window may not be ready?
	console.log("%cTheatre Inserts", "font-weight: bold; font-size: 30px; font-style: italic; color: black;");
	// NOTE: Closed alpha/beta is currently all rights reserved!
	console.log("%c-- Theatre is Powered by Free Open Source GPLv3 Software --", "font-weight: bold; font-size: 12");
});

/**
 * Add to stage button on ActorDirectory Sidebar
 */
Hooks.on("getActorDirectoryEntryContext", async (html: any, options: any) => {
	if (!game.user?.isGM && TheatreSettings.get(TheatreSettings.GM_ONLY)) return;

	const getActorData = (target: any) => {
		const actor = game.actors?.get(target.data("documentId"));
		return actor;
	};

	options.splice(
		3,
		0,
		{
			name: "Add to Stage",
			condition: (target: any) => !Theatre.instance.stage.isActorStaged(<Actor>getActorData(target)),
			icon: '<i class="fas fa-theater-masks"></i>',
			callback: (target: any) => Theatre.instance.navBar.addToNavBar(<Actor>getActorData(target)),
		},
		{
			name: "Remove from Stage",
			condition: (target: any) => Theatre.instance.stage.isActorStaged(<Actor>getActorData(target)),
			icon: '<i class="fas fa-theater-masks"></i>',
			callback: (target: any) => Theatre.instance.removeFromNavBar(<Actor>getActorData(target)),
		}
	);
});

Hooks.once("setup", () => {
	// TODO TO REPLACE WITH API STANDARD
	//@ts-ignore
	globalThis.theatre = new Theatre();
});

Hooks.once("init", () => {
	// module keybinds

	game.keybindings.register("theatre", "unfocusTextArea", {
		name: "Theatre.UI.Keybinds.unfocusTextArea",
		hint: "",
		editable: [
			{
				key: "Escape",
			},
		],
		onDown: (event: any) => {
			if (document.activeElement === document.getElementById("chat-message")) {
				event.preventDefault();
				event.stopPropagation();
				document.getElementById("chat-message")?.blur();
			}
		},
		restricted: false,
	});

	game.keybindings.register("theatre", "addOwnedToStage", {
		name: "Theatre.UI.Keybinds.addOwnedToStage",
		hint: "",
		editable: [
			{
				key: "Enter",
				modifiers: ["Alt"],
			},
		],
		onDown: () => {
			const ownedActors = <Actor[]>game.actors?.filter((a: any) => a.ownership === 3);
			const ownedTokens = ownedActors.map((a: any) => a.getActiveTokens());
			for (const tokenArray of ownedTokens) {
				// NEVER USE forEach
				//tokenArray.forEach(t => Theatre.instance.navBar.addToNavBar(t.actor));
				for (const t of tokenArray) {
					Theatre.instance.navBar.addToNavBar(t.actor);
				}
			}
		},
		restricted: false,
	});

	game.keybindings.register("theatre", "addSelectedToStage", {
		name: "Theatre.UI.Keybinds.addSelectedToStage",
		hint: "",
		editable: [
			{
				key: "Enter",
				modifiers: ["Shift"],
			},
		],
		onDown: () => {
			for (const tkn of <Token[]>canvas.tokens?.controlled) {
				if (tkn.actor?.data) {
					//@ts-ignore
					Theatre.instance.navBar.addToNavBar(<Actor>tkn.actor?.data);
				} else {
					Theatre.instance.navBar.addToNavBar(<Actor>tkn.actor);
				}
			}
		},
		restricted: false,
	});

	game.keybindings.register("theatre", "narratorMode", {
		name: "Theatre.UI.Keybinds.narratorMode",
		hint: "",
		editable: [
			{
				key: "KeyN",
				modifiers: ["Alt"],
			},
		],
		onDown: () => {
			const narratorButton = $(document).find(`div.theatre-icon-narrator`).closest(`div.theatre-control-btn`);
			if (KHelpers.hasClass(<any>narratorButton[0], "theatre-control-nav-bar-item-speakingas"))
				Theatre.instance.toggleNarratorBar(false);
			else Theatre.instance.toggleNarratorBar(true);

			document.getElementById("chat-message")?.blur();
		},
		restricted: false,
	});

	game.keybindings.register("theatre", "flipPortrait", {
		name: "Theatre.UI.Keybinds.flipPortrait",
		hint: "",
		editable: [
			{
				key: "KeyR",
				modifiers: ["Alt"],
			},
		],
		onDown: () => {
			if (Theatre.instance.speakingAs) Theatre.instance.mirrorInsertById(Theatre.instance.speakingAs);
		},
		restricted: false,
	});

	game.keybindings.register("theatre", "nudgePortraitLeft", {
		name: "Theatre.UI.Keybinds.nudgePortraitLeft",
		hint: "",
		editable: [
			{
				key: "KeyZ",
				modifiers: ["Alt"],
			},
		],
		onDown: () => {
			const imgId = Theatre.instance.speakingAs;
			if (!imgId) {
				return;
			}
			const insert = <StageInsert>Theatre.instance.stage.stageInserts.find((p) => p.imgId === imgId);
			if (!insert.portrait) {
				return;
			}
			const oleft = insert.portrait.root.x,
				otop = insert.portrait.root.y;
			const tweenId = "portraitMove";
			const tween = TweenMax.to(insert.portrait.root, 0.5, {
				pixi: { x: oleft - 50, y: otop },
				ease: Power3.easeOut,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
			});
			Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

			// send sceneEvent
			Theatre.instance.sceneEventProcessor.sendSceneEvent(SceneEventTypes.positionupdate, {
				insertid: insert.imgId,
				position: { x: oleft - 50, y: otop, mirror: insert.mirrored },
			});
		},
		restricted: false,
	});

	game.keybindings.register("theatre", "nudgePortraitRight", {
		name: "Theatre.UI.Keybinds.nudgePortraitRight",
		hint: "",
		editable: [
			{
				key: "KeyC",
				modifiers: ["Alt"],
			},
		],
		onDown: () => {
			const imgId = Theatre.instance.speakingAs;
			if (!imgId) {
				return;
			}
			const insert = <StageInsert>Theatre.instance.stage.stageInserts.find((p) => p.imgId === imgId);
			if (!insert.portrait) {
				return;
			}
			const oleft = insert.portrait.root.x,
				otop = insert.portrait.root.y;
			const tweenId = "portraitMove";
			const tween = TweenMax.to(insert.portrait.root, 0.5, {
				pixi: { x: oleft + 50, y: otop },
				ease: Power3.easeOut,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
			});
			Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

			// send sceneEvent
			Theatre.instance.sceneEventProcessor.sendSceneEvent(SceneEventTypes.positionupdate, {
				insertid: insert.imgId,
				position: { x: oleft + 50, y: otop, mirror: insert.mirrored },
			});
		},
		restricted: false,
	});

	game.keybindings.register("theatre", "nudgePortraitUp", {
		name: "Theatre.UI.Keybinds.nudgePortraitUp",
		hint: "",
		editable: [
			{
				key: "KeyS",
				modifiers: ["Alt"],
			},
		],
		onDown: () => {
			const imgId = Theatre.instance.speakingAs;
			if (!imgId) {
				return;
			}
			const insert = <StageInsert>Theatre.instance.stage.stageInserts.find((p) => p.imgId === imgId);
			if (!insert.portrait) {
				return;
			}
			const oleft = insert.portrait.root.x,
				otop = insert.portrait.root.y;
			const tweenId = "portraitMove";
			const tween = TweenMax.to(insert.portrait.root, 0.5, {
				pixi: { x: oleft, y: otop - 50 },
				ease: Power3.easeOut,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
			});
			Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

			// send sceneEvent
			Theatre.instance.sceneEventProcessor.sendSceneEvent(SceneEventTypes.positionupdate, {
				insertid: insert.imgId,
				position: { x: oleft, y: otop - 50, mirror: insert.mirrored },
			});
		},
		restricted: false,
	});

	game.keybindings.register("theatre", "nudgePortraitDown", {
		name: "Theatre.UI.Keybinds.nudgePortraitDown",
		hint: "",
		editable: [
			{
				key: "KeyX",
				modifiers: ["Alt"],
			},
		],
		onDown: () => {
			const imgId = Theatre.instance.speakingAs;
			if (!imgId) {
				return;
			}
			const insert = <StageInsert>Theatre.instance.stage.stageInserts.find((p) => p.imgId === imgId);
			if (!insert.portrait) {
				return;
			}
			const oleft = insert.portrait.root.x,
				otop = insert.portrait.root.y;
			const tweenId = "portraitMove";
			const tween = TweenMax.to(insert.portrait.root, 0.5, {
				pixi: { x: oleft, y: otop + 50 },
				ease: Power3.easeOut,
				onComplete: function (ctx, imgId, tweenId) {
					// decrement the rendering accumulator
					ctx._removeDockTween(imgId, this, tweenId);
					// remove our own reference from the dockContainer tweens
				},
				onCompleteParams: [Theatre.instance, insert.imgId, tweenId],
			});
			Theatre.instance._addDockTween(insert.imgId, tween, tweenId);

			// send sceneEvent
			Theatre.instance.sceneEventProcessor.sendSceneEvent(SceneEventTypes.positionupdate, {
				insertid: insert.imgId,
				position: { x: oleft, y: otop + 50, mirror: insert.mirrored },
			});
		},
		restricted: false,
	});

	for (let i = 1; i < 11; i++) {
		game.keybindings.register("theatre", `activateStaged${i}`, {
			name: `Theatre.UI.Keybinds.activateStaged${i}`,
			hint: "",
			editable: [
				{
					key: `Digit${i === 10 ? 0 : i}`,
					modifiers: ["Control"],
				},
			],
			onDown: (ev: any) => {
				const ids = Object.keys(Theatre.instance.stage);
				const id = ids[i - 1];
				if (id) {
					Theatre.instance.activateInsertById(id, ev);
				}
				document.getElementById("chat-message")?.blur();
			},
			restricted: false,
		});

		game.keybindings.register("theatre", `removeStaged${i}`, {
			name: `Theatre.UI.Keybinds.removeStaged${i}`,
			hint: "",
			editable: [
				{
					key: `Digit${i === 10 ? 0 : i}`,
					modifiers: ["Control", "Alt"],
				},
			],
			onDown: () => {
				const ids = Object.keys(Theatre.instance.stage);
				const id = ids[i - 1];
				if (id) Theatre.instance.stage.removeInsertById(id);
			},
			restricted: false,
		});
	}
});

/**
 * Hide player list (and macro hotbar) when stage is active (and not suppressed)
 */
Hooks.on("theatreDockActive", (insertCount: any) => {
	if (!insertCount) {
		return;
	}
	if (TheatreSettings.get(TheatreSettings.SHIFT_PAUSE_ICON))
		// The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
		//document.querySelectorAll("#pause").forEach(ele => KHelpers.addClass(ele, "theatre-centered"));
		for (const ele of document.querySelectorAll("#pause")) {
			//@ts-ignore
			KHelpers.addClass(ele, "theatre-centered");
		}

	if (!TheatreSettings.get("autoHideBottom")) {
		return;
	}
	if (!Theatre.instance.isSuppressed) {
		$("#players").addClass("theatre-invisible");
		$("#hotbar").addClass("theatre-invisible");
	}
});

/**
 * If Argon is active, wrap CombatHudCanvasElement#toggleMacroPlayers to prevent playesr list and macro hotbar from being shown
 */
Hooks.once("ready", () => {
	if (!TheatreSettings.get("autoHideBottom")) {
		return;
	}
	if (!game.modules.get("enhancedcombathud")?.active) {
		return;
	}
	//@ts-ignore
	libWrapper.register(
		TheatreSettings.NAMESPACE,
		"CombatHudCanvasElement.prototype.toggleMacroPlayers",
		(wrapped: any, togg: any) => {
			if (togg && Theatre.instance.dockActive) {
				return;
			}
			return wrapped(togg);
		},
		"MIXED"
	);
});

/**
 * Hide/show macro hotbar when stage is suppressed
 */
Hooks.on("theatreSuppression", (suppressed: boolean) => {
	if (!TheatreSettings.get("autoHideBottom")) {
		return;
	}
	if (!TheatreSettings.get("suppressMacroHotbar")) {
		return;
	}
	if (!Theatre.instance.dockActive) {
		return;
	}

	if (suppressed) {
		$("#players").removeClass("theatre-invisible");
		$("#hotbar").removeClass("theatre-invisible");
	} else {
		$("#players").addClass("theatre-invisible");
		$("#hotbar").addClass("theatre-invisible");
	}
});

Hooks.on("renderPause", () => {
	if (!Theatre.instance.dockActive) {
		return;
	}
	if (!TheatreSettings.get(TheatreSettings.SHIFT_PAUSE_ICON)) {
		return;
	}
	// The "MyTab" module inserts another element with id "pause". Use querySelectorAll to make sure we catch both
	//document.querySelectorAll("#pause").forEach(ele => KHelpers.addClass(ele, "theatre-centered"));
	for (const ele of document.querySelectorAll("#pause")) {
		KHelpers.addClass(<HTMLElement>ele, "theatre-centered");
	}
});

/**
 * If an actor changes, update the stage accordingly
 */
Hooks.on("updateActor", (actor: Actor, data: any) => {
	const insert = Theatre.instance.stage.getInsertById(`theatre-${actor.id}`);
	if (!insert) {
		return;
	}
	insert.label.text = ActorExtensions.getDisplayName(<string>actor.id);
	Theatre.instance._renderTheatre(performance.now());
});

Hooks.on("getSceneControlButtons", (controls) => {
	// Use "theatre", since Theatre.SETTINGS may not be available yet
	if (!game.user?.isGM && game.settings.get("theatre", "gmOnly")) {
		const suppressTheatreTool = <any>{
			name: "suppressTheatre",
			title: "Theatre.UI.Title.SuppressTheatre",
			icon: "fas fa-theater-masks",
			toggle: true,
			active: false,
			onClick: (toggle: boolean) => Theatre.instance.updateSuppression(toggle), // TODO Suppress theatre
			visible: true,
		};
		const tokenControls = <SceneControl[]>controls.find((group) => group.name === "token")?.tools;
		tokenControls.push(suppressTheatreTool);
	}
});
