const express = require('express');
const router = express.Router();

function RenderOption(key, value, initial) {
	this.key = key;
	this.value = value;
	this.initial = initial;
}

class RenderOptions {
	constructor() {
		this.isEnabled = false;
		this.options = new Map();
	}

	enable() {
		this.isEnabled = true;
		return this;
	}

	disable() {
		this.isEnabled = false;
		return this;
	}

	getOptionValue(key) {
		return this.options.get(key)?.value;
	}

	getOptionInitial(key) {
		return this.options.get(key)?.initial;
	}

	addOption(key, initial) {
		this.options.set(key, new RenderOption(key, initial, initial));
		return this;
	}

	updateOptionValue(key, value) {
		if (this.options.has(key)) {
			this.options.get(key).value = (typeof value !== "undefined") ? value : this.getOptionInitial(key);
		}
		return this;
	}
}

class RenderGeneral extends RenderOptions {
	constructor() {
		super();
		this.addOption("max-width", Infinity);
		this.addOption("max-height", Infinity);
		this.addOption("showBorder", true);
		this.addOption("delayCSR", 0);
	}
}

class RenderSSR extends RenderOptions {
	constructor() {
		super();
		this.addOption("maxwaitmillis", null);
		this.addOption("width", null);
		this.addOption("limitcontent", false);
	}
}

class RenderCSR extends RenderOptions {
	constructor() {
		super();
		this.addOption("width", null);
		this.addOption("maxHeight", Infinity);
		this.addOption("showBorder", null);
		this.addOption("allowInteract", true);
		this.addOption("showRenderProgress", true);
		this.addOption("useShadowDOM", false);
	}
}

function getUrlSSR(uuid, renderSSR) {
	if (!uuid || !renderSSR.isEnabled) {
		return null;
	}
	const baseUrl = 'https://www.wolframcloud.com/statichtml/' + uuid;
	let queryString = "";
	let i = 0;
	for (const [key, option] of renderSSR.options) {
		if (
			typeof option.value !== undefined
			&& option.value !== option.initial
			&& option.value !== String(option.initial)
		) {
			queryString += ( (i == 0) ? "?" : "&" ) + key + "=" + option.value;
			i++;
		}
	}
	return baseUrl + queryString;
}

async function getServerSideRenderingData(uuid, renderSSR) {
	// Server-Side Rendering
	let statichtml = null;
	const url_ssr = getUrlSSR(uuid, renderSSR);
	if (url_ssr) {
		const response = await fetch(url_ssr);
		statichtml = await response.text();
	}
	return  { url: url_ssr, statichtml: statichtml };
}

function getClientSideRenderingData(uuid, renderCSR) {
	if (!uuid || !renderCSR.isEnabled) {
		return null;
	}
	const url_csr = 'https://www.wolframcloud.com/obj/' + uuid;
	const options = {};
	for (const [key, option] of renderCSR.options) {
		if (
			typeof option.value !== undefined
			&& option.value !== option.initial
			&& option.value !== String(option.initial)
		) {
			options[key] = option.value;
		}
	}
	return { url: url_csr, options: options };
}

router.get('/', async (req, res) => {
	const uuid = req.query.uuid ? req.query.uuid : null;
	const ssrEnabled = uuid && req.query.ssrEnabled === "on" ? req.query.ssrEnabled : false;
	const csrEnabled = uuid && req.query.csrEnabled === "on" ? req.query.csrEnabled : false;

	const renderGeneral = (new RenderGeneral())
		.updateOptionValue("max-width", req.query.maxWidthGeneral)
		.updateOptionValue("max-height", req.query.maxHeightGeneral)
		.updateOptionValue("showBorder", req.query.showBorderGeneral === "on")
		.updateOptionValue("delayCSR", req.query.delayCSRGeneral)

	const renderSSR = (new RenderSSR())
		.updateOptionValue("maxwaitmillis", req.query.maxwaitmillisSSR)
		.updateOptionValue("width", req.query.widthSSR)
		.updateOptionValue("limitcontent", req.query.limitcontentSSR === "on");
	if (ssrEnabled) {
		renderSSR.enable();
	}
	const dataSSR = await getServerSideRenderingData(uuid, renderSSR);

	const renderCSR = (new RenderCSR())
		.updateOptionValue("width", req.query.widthCSR)
		.updateOptionValue("maxHeight", req.query.maxHeightCSR)
		.updateOptionValue("showBorder", req.query.showBorderCSR)
		.updateOptionValue("allowInteract", req.query.allowInteractCSR === "on")
		.updateOptionValue("showRenderProgress", req.query.showRenderProgressCSR === "on")
		.updateOptionValue("useShadowDOM", req.query.useShadowDOMCSR === "on")
	if (csrEnabled) {
		renderCSR.enable();
	}
	const dataCSR = getClientSideRenderingData(uuid, renderCSR);

	res.render('index', {
		uuid: uuid,
		renderGeneral: renderGeneral,
		renderSSR: renderSSR,
		dataSSR: dataSSR,
		renderCSR: renderCSR,
		dataCSR: dataCSR,
	});
});

module.exports = router;
