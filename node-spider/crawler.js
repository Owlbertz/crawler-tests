var Spider = require('node-spider');

let baseUrl = process.argv[2]; //'http://localhost:3000';
console.log(baseUrl);
let crawledUrls = [];
let titleBase = ' | Foundation for Sites 6 Docs';
let startDate = new Date();

var spider = new Spider({
	// How many requests can be run in parallel
	concurrent: 5,
	// How long to wait after each request
	delay: 1000 * 0.5,
	// A stream to where internal logs are sent, optional
	// logs: process.stderr,
	// Re-visit visited URLs, false by default
	allowDuplicates: false,
	// If `true` all queued handlers will be try-catch'd, errors go to `error` callback
	catchErrors: true,
	// If `true` the spider will set the Referer header automatically on subsequent requests
	addReferrer: false,
	// If `true` adds the X-Requested-With:XMLHttpRequest header
	xhr: false,
	// If `true` adds the Connection:keep-alive header and forever option on request module
	keepAlive: false,
	// Called when there's an error, throw will be used if none is provided
	error: function(err, url) {
		console.log(err, url);
	},
	// Called when there are no more requests
	done: function() {
		let endDate = new Date();
		let duration = endDate - startDate;
		console.log(`Finished crawl, found ${crawledUrls.length} pages, it tool ${duration} ms.`);
	},

	//- All options are passed to `request` module, for example:
	headers: { 'user-agent': 'node-spider' },
	encoding: 'utf8'
});


let normalizeUrl = function(currentUrl) {
    currentUrl = currentUrl.replace(/\/\//g, '/'); // Normalize double slash
    currentUrl = currentUrl.replace(':/', '://'); // Fix broken protocol
    currentUrl = currentUrl.substr(0, currentUrl.indexOf('#') > -1 ? currentUrl.indexOf('#') : currentUrl.length); // Remove hash
    currentUrl = currentUrl.replace(/\/$/, '');// Normalize trailing slash
    return currentUrl;
};

var handleRequest = function(doc) {
	// new page crawled
	let currentUrl = normalizeUrl(doc.url);
	console.log(crawledUrls.length.toString(), doc.$('title').text().replace(titleBase, ''), '\t', currentUrl);
	crawledUrls.push(currentUrl);
	if (crawledUrls.length % 50 === 0) {
		console.log(`Crawled ${crawledUrls.length} sites`);
	}

	// uses cheerio, check its docs for more info
	doc.$('a').each(function(i, elem) {
		// do stuff with element
		var href = doc.$(elem).attr('href');
		if (!href || (href.indexOf('http') === 0)) return;

		let url = baseUrl + '/' + href;
		url = normalizeUrl(url);

		spider.queue(url, handleRequest);
	});
};

// start crawling
spider.queue(baseUrl, handleRequest);
