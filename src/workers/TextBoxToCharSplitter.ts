import KHelpers from "./KHelpers";

export default class TextBoxToCharSplitter {
	/**
	 * Split to chars, logically group words based on language.
	 *
	 * @param text: The text to split.
	 * @param textBox: The textBox the text will be contained in.
	 *
	 * @return: An array of HTMLElements of the split text.
	 */
	static splitTextBoxToChars(text: string, textBox: HTMLElement): HTMLElement[] {
		let charSpans = [];
		let fontSize = Number(
			KHelpers.style(textBox)
				.getPropertyValue("font-size")
				.match(/\-*\d+\.*\d*/) || 0
		);
		let splitMode = 1;

		// we have 2 modes, if we're a latin based language, or a language that does word
		// grouping of characters, we should attempt to preserve words by collecting
		// character spans into divs.
		// If we're a language that is symbol based, and don't care about word groupings
		// then we just out a stream of characters without regard to groupings.
		//
		//
		switch (game.i18n.lang) {
			case "ja":
				// Kinsoku Shori (JP)
				splitMode = 3;
				break;
			case "cn":
				// 按照日文方式换行 (CN)
				splitMode = 3;
				break;
			case "ko":
				// KS X ISO/IEC 26300:2007 (KO)
				splitMode = 4;
				break;
			case "zh":
			case "th":
				// word break with impunity
				splitMode = 1;
				break;
			default:
				// don't word break
				splitMode = 2;
				break;
		}

		if (splitMode == 1) {
			// split chars
			for (let c of text) {
				if (c == " ") {
					let cspan = document.createElement("span");
					cspan.textContent = c;
					cspan.style.height = `${fontSize}px`;
					cspan.style.width = `${fontSize / 4}px`;
					cspan.style.position = "relative";
					textBox.appendChild(cspan);
					charSpans.push(cspan);
				} else if (c == "\n") {
					let cspan = document.createElement("hr");
					textBox.appendChild(cspan);
				} else {
					let cspan = document.createElement("span");
					cspan.textContent = c;
					cspan.style.height = `${fontSize}px`;
					cspan.style.position = "relative";
					textBox.appendChild(cspan);
					charSpans.push(cspan);
				}

				// relative positioning
			}
		} else if (splitMode == 2) {
			// split chars, group words
			let word = document.createElement("div");
			let prevChar = "";
			word.style.height = `${fontSize}px`;
			word.style.position = "relative";

			for (let c of text) {
				if (c == " ") {
					let cspan = document.createElement("span");
					cspan.textContent = c;
					cspan.style.height = `${fontSize}px`;
					cspan.style.width = `${fontSize / 4}px`;
					// not part of an extended white space, append word, start new one
					if (prevChar != " " && prevChar != "\n") {
						textBox.appendChild(word);
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
					textBox.appendChild(cspan);
					cspan.style.position = "relative";
					charSpans.push(cspan);
				} else if (c == "\n") {
					let cspan = document.createElement("hr");
					if (prevChar != " " && prevChar != "\n") {
						textBox.appendChild(word);
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
					textBox.appendChild(cspan);
				} else {
					let cspan = document.createElement("span");
					cspan.textContent = c;
					cspan.style.height = `${fontSize}px`;
					// we're part of a word
					cspan.style.position = "relative";
					word.appendChild(cspan);
					charSpans.push(cspan);
				}

				// prevChar
				prevChar = c;
			}
			textBox.append(word);
		} else if (splitMode == 3) {
			// Kinsoku Shori (JP)
			let rHead =
				")）]｝〕〉》」』】〙〗〟'\"｠»ヽヾーァィゥェォッャュョヮヵヶぁぃぅぇぉっゃゅょゎゕゖㇰㇱㇲㇳㇴㇵㇶㇷㇸㇹㇺㇻㇼㇽㇾㇿ々〻‐゠–〜? ! ‼ ⁇ ⁈ ⁉・、:;,。.";
			let rTail = "(（[｛〔〈《「『【〘〖〝'\"｟«";
			let rSplit = "—.‥〳〴〵";
			let word = null;
			for (let idx = 0; idx < text.length; ++idx) {
				let c = <string>text[idx];
				let rh = false;
				let rt = false;
				let rs = false;
				let nl = false;
				let sp = false;
				let nv = false;
				let la = text[idx + 1];
				//if (!la) la = text[idx+1];

				if (la && rHead.match(RegExp.escape(la))) {
					// if la is of the rHead set
					rh = true;
					if (!word) {
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
				}
				if (rTail.match(RegExp.escape(c))) {
					// if c is of the rTail set
					rt = true;
					if (!word) {
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
				}
				if (rSplit.match(RegExp.escape(c)) && la && la == c) {
					// if c is of the rSplit set, and is followed by another of its type
					rs = true;
					if (!word) {
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
				}
				if (!isNaN(Number(c)) && la && !isNaN(Number(la))) {
					// keep numbers together
					rs = true;
					if (!word) {
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
				}

				// scan next character to see if it belongs in the rHead or rTail
				if (la && /*rTail.match(text[idx+1]) || */ rHead.match(RegExp.escape(la))) nv = true;

				if (c == " ") {
					sp = true;
				} else if (c == "\n") {
					// end any word immediately, we trust the formatting over the Kinsoku Shori
					nl = true;
				} else {
					let cspan = document.createElement("span");
					cspan.textContent = c;
					cspan.style.height = `${fontSize}px`;
					cspan.style.position = "relative";
					if (word) word.appendChild(cspan);
					else textBox.appendChild(cspan);
					charSpans.push(cspan);
				}

				// output word when we hit our limit, and current c is not in rTail/rHead/rSplit
				// and that the character following our word is not in the restricted rHead
				if (word && word.children.length >= 2 && !rt && !rh && !rs && !nv) {
					textBox.appendChild(word);
					word = null;
				}

				if (nl) {
					// newline after word if present
					let cspan = document.createElement("hr");
					if (word) {
						textBox.appendChild(word);
						word = null;
					}
					textBox.appendChild(cspan);
				} else if (sp) {
					// if not a newline, but a space output word before space
					if (word) {
						textBox.appendChild(word);
						word = null;
					}
					let cspan = document.createElement("span");
					cspan.textContent = c;
					cspan.style.height = `${fontSize}px`;
					cspan.style.width = `${fontSize / 4}px`;
					cspan.style.position = "relative";
					textBox.appendChild(cspan);
					charSpans.push(cspan);
				}
			}
			if (word) {
				textBox.appendChild(word);
				word = null;
			}
		} else if (splitMode == 4) {
			// Korean Line breaking KS X ISO/IEC 26300:2007 (KO)
			let rHead = "!%),.:;?]}¢°'\"†‡℃〆〈《「『〕！％），．：；？］｝ ";
			let rTail = "$([\\{£¥'\"々〇〉》」〔＄（［｛｠￥￦#";
			let word = null;
			for (let idx = 0; idx < text.length; ++idx) {
				let c = <string>text[idx];
				let rh = false;
				let rt = false;
				let rs = false;
				let nl = false;
				let nv = false;
				let la = text[idx + 1];
				//if (!la) la = text[idx+1];

				if (la && rHead.match(RegExp.escape(la))) {
					// if la is of the rHead set
					rh = true;
					if (!word) {
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
				}
				if (rTail.match(RegExp.escape(c))) {
					// if c is of the rTail set
					rt = true;
					if (!word) {
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
				}
				if (!isNaN(Number(c)) && la && !isNaN(Number(la))) {
					// keep numbers together
					rs = true;
					if (!word) {
						word = document.createElement("div");
						word.style.height = `${fontSize}px`;
						word.style.position = "relative";
					}
				}

				// scan next character to see if it belongs in the rHead or rTail
				if (la && /*rTail.match(text[idx+1]) || */ rHead.match(RegExp.escape(la))) nv = true;

				if (c == " ") {
					// if not a newline, but a space output the space just like any other character.
					let cspan = document.createElement("span");
					cspan.textContent = c;
					cspan.style.height = `${fontSize}px`;
					cspan.style.width = `${fontSize / 4}px`;
					cspan.style.position = "relative";
					if (word) {
						word.appendChild(cspan);
					} else {
						textBox.appendChild(cspan);
					}
					charSpans.push(cspan);
				} else if (c == "\n") {
					// end any word immediately, we trust the formatting over the Kinsoku Shori
					nl = true;
				} else {
					let cspan = document.createElement("span");
					cspan.textContent = c;
					cspan.style.height = `${fontSize}px`;
					cspan.style.position = "relative";
					if (word) {
						word.appendChild(cspan);
					} else {
						textBox.appendChild(cspan);
					}
					charSpans.push(cspan);
				}

				// output word when we hit our limit, and current c is not in rTail/rHead/rSplit
				// and that the character following our word is not in the restricted rHead
				if (word && word.children.length >= 2 && !rh && !rt && !rs && !nv) {
					textBox.appendChild(word);
					word = null;
				}

				if (nl) {
					// newline after word if present
					let cspan = document.createElement("hr");
					if (word) {
						textBox.appendChild(word);
						word = null;
					}
					textBox.appendChild(cspan);
				}
			}
			if (word) {
				textBox.appendChild(word);
				word = null;
			}
		}

		return charSpans;
	}
}
