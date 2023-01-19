export default class KHelpers {
	static hasClass(el: HTMLElement, className: string) {
		return el.classList
			? el.classList.contains(className)
			: new RegExp("\\b" + className + "\\b").test(el.className);
	}

	static addClass(el: HTMLElement, className: string) {
		if (el.classList) el.classList.add(className);
		else if (!KHelpers.hasClass(el, className)) el.className += " " + className;
	}

	static removeClass(el: HTMLElement, className: string) {
		if (el.classList) el.classList.remove(className);
		else el.className = el.className.replace(new RegExp("\\b" + className + "\\b", "g"), "");
	}

	static offset(el: HTMLElement) {
		var rect = el.getBoundingClientRect(),
			scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
			scrollTop = window.pageYOffset || document.documentElement.scrollTop;
		return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
	}

	static style(el: HTMLElement) {
		return el.currentStyle || window.getComputedStyle(el);
	}
	static insertAfter(el: HTMLElement, referenceNode: Node) {
		referenceNode.parentNode?.insertBefore(el, referenceNode.nextSibling);
	}
	static insertBefore(el: HTMLElement, referenceNode: Node) {
		referenceNode.parentNode?.insertBefore(el, referenceNode);
	}

	/**
	 * Helper to grab a parent class via CSS ClassName
	 *
	 * @param elem (HTMLElement) : the element to start from.
	 * @param cls (String) : The class name to search for.
	 * @param depth (Number) : The maximum height/depth to look up.
	 * @returns (HTMLElement) : the parent class if found, or null if
	 *                          no such parent exists within the specified
	 *                          depth.
	 */

	static seekParentClass(elem: HTMLElement, cls: string, depth: number): HTMLElement {
		depth = depth || 5;
		let el = elem;
		let targ = null;
		for (let i = 0; i < depth; ++i) {
			if (!el) break;
			if (KHelpers.hasClass(el, cls)) {
				targ = el;
				break;
			} else {
				el = el.parentNode as HTMLElement;
			}
		}
		return <HTMLElement>targ;
	}
}
