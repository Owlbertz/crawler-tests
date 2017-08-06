let Crawler = require('simplecrawler');
let baseUrl = process.argv[2]; //'http://localhost:3000';
console.log(baseUrl);
let crawledUrls = [];
let queuedUrls = [baseUrl];
let titleBase = ' | Foundation for Sites 6 Docs';
let startDate = new Date();
let parseRobots = require('robots-parser');
let url = require('url');
let request = require('request');
let sitemap = require('sitemapper');

let normalizeUrl = function(currentUrl) {
    currentUrl = currentUrl.replace(/\/\//g, '/'); // Normalize double slash
    currentUrl = currentUrl.replace(':/', '://'); // Fix broken protocol
    currentUrl = currentUrl.substr(0, currentUrl.indexOf('#') > -1 ? currentUrl.indexOf('#') : currentUrl.length); // Remove hash
    currentUrl = currentUrl.replace(/\/$/, '');// Normalize trailing slash
    return currentUrl;
};
var crawler = new Crawler(baseUrl);

crawler.on('crawlstart', function() {
    console.log('Crawl starting', baseUrl);
});

crawler.on('fetchstart', function(queueItem) {
    // console.log('fetchStart', queueItem);
});

crawler.on('fetchcomplete', function(queueItem) {
    // console.log('fetchcomplete', queueItem);
    console.log('Crawled', queueItem.uriPath)
});

crawler.on('complete', function() {
    console.log('Finished!');
});

let robotsUrl = baseUrl.replace(/\/?index.html/, '') + '/robots.txt';
request(robotsUrl, function (res, response) {
    var robots = parseRobots(robotsUrl, response.body);

    crawler.addFetchCondition(function (parsedUrl) {
        var standardUrl = url.format({
            protocol: parsedUrl.protocol,
            host: parsedUrl.host,
            pathname: parsedUrl.path.split('?')[0],
            search: parsedUrl.path.split('?')[1]
        });

        var allowed = false;

        // The punycode module sometimes chokes on really weird domain
        // names. Catching those errors to prevent the crawler from crashing
        try {
            allowed = robots.isAllowed(standardUrl, crawler.userAgent);
        } catch (error) {
            console.error('Caught error from robots.isAllowed method on url %s', standardUrl, error);
        }

        return allowed;
    });

    console.log('Sitemap', robots.getSitemaps());
    let sitemaps = robots.getSitemaps();

    sitemap.fetch(sitemaps[0]).then(function(sites) {
        console.log(sites);

        for (let i = 0; i < sites.length; i++) {
            crawler.queueURL(sites[i], undefined, false);
        }

        crawler.start();
    });

});