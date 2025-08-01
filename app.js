const express = require('express');
const indexRouter = require('./routes/index.js');

const app = express();
app.set('views', 'views');
app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static('public'));

const IS_LOG_VERBOSE = true;
const IS_USE_SHADOW_DOM = true;
const WIDTH_IN_PIXELS = 700;
const EXTRA_WIDTH_IN_PIXELS = 0;

const PORT = 3000;
const EXAMPLE_URI = '85fd1874-61c4-4798-8e48-d8ba6d037984';
// 'e3303fce-ead8-4d8b-b529-b4c9b4c77a70'
// 'a70939f9-cd26-42b9-a6db-c56c7c3ea58d'
const DATA_TYPE = 'application/vnd.wolfram.notebook';

async function getServerSideRenderingData(uri = EXAMPLE_URI) {
	// Server-Side Rendering
	const url_ssr = 'https://www.wolframcloud.com/statichtml/' + uri + '?width=' + WIDTH_IN_PIXELS;
	if (IS_LOG_VERBOSE) {
		console.log(url_ssr);
	}
	const response = await fetch(url_ssr);
	const data_ssr = await response.text();
	return data_ssr;
}

async function WolframCloudEmbeddedNotebook(run_ssr = true, run_csr = true, uri = EXAMPLE_URI) {
	const data_ssr = run_ssr ? await getServerSideRenderingData(uri) : "";
	const url_csr = 'https://www.wolframcloud.com/obj/' + uri;
	const div_for_nb =
			'<div '
		+		(run_csr ? 'data-url="' + url_csr + '" data-type="' + DATA_TYPE + '"': '')
		+	'>'
		+		data_ssr
		+	'</div>';
	return div_for_nb;
}

function writeClientSideRenderingScript(use_shadow_dom = false) {
	// Client-Side Rendering
	const script_for_embedder = 
			'<script crossorigin src="https://unpkg.com/wolfram-notebook-embedder@0.3/dist/wolfram-notebook-embedder.min.js"></script>';
	const script_to_run_embedder = 
			'<script>'
		+		'window.addEventListener("DOMContentLoaded", (event) => {'
		+			'const nbs = document.querySelectorAll("[data-type=\'' + DATA_TYPE + '\']");'
		+			'nbs.forEach((nb) => {'
		+				'WolframNotebookEmbedder.embed(nb.dataset.url, nb, '
		+ 					'{'
		+						'"width": ' + WIDTH_IN_PIXELS + ','
		+						'"height": ' + 250 + ','
		+						'"useShadowDOM": ' + use_shadow_dom
		+					'}'
		+				');'
		+			'});'
		+		'});'
		+	'</script>';
	if (IS_LOG_VERBOSE) {
		console.log(script_to_run_embedder);
	}
	return script_for_embedder + script_to_run_embedder;
}

function writeTwoColumnPage(leftContent, rightContent) {
	return 	'<table border="1">'
	+			'<tr>'
		+			'<td style="vertical-align: top; max-width:' + (WIDTH_IN_PIXELS + EXTRA_WIDTH_IN_PIXELS) + 'px;">'
		+				leftContent
		+			'</td>'
		+			'<td style="vertical-align: top; max-width:' + (WIDTH_IN_PIXELS + EXTRA_WIDTH_IN_PIXELS) + 'px;">'
		+				rightContent
		+			'</td>'
	+			'</tr>'
	+		'</table>';
}

app.get(['/basic/','/basic/{:uri}'], async (req, res) => {
	const URI = req.params.uri && req.params.uri !== 'favicon.ico' ? req.params.uri : EXAMPLE_URI;
	res.send(
			writeTwoColumnPage(
				'<h1> Only SSR </h1>' + await WolframCloudEmbeddedNotebook(true, false, URI),
				'<h1> SSR + CSR </h1>' + await WolframCloudEmbeddedNotebook(true, true, URI)
			)
		+	writeClientSideRenderingScript(IS_USE_SHADOW_DOM)
	);
});

app.get('/favicon.ico', (req, res) => res.status(204));
app.use("/", indexRouter);

app.listen(PORT, () => {
	console.log(`Server running at http://localhost:${PORT}`);
});
