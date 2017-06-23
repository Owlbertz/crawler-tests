let Crawler = require("crawler");
let baseUrl = process.argv[2]; //'http://localhost:3000';
console.log(baseUrl);
let crawledUrls = [];
let queuedUrls = [baseUrl];
let titleBase = ' | Foundation for Sites 6 Docs';
let startDate = new Date();
let c = new Crawler({
    maxConnections: 5,
    // rateLimit: 500,
    // This will be called for each crawled page
    callback: function (error, res, done) {
        if (error || !res.$) {
            console.log(error);
        } else {
            let $ = res.$;
            // $ is Cheerio by default
            //a lean implementation of core jQuery designed specifically for the server
            let currentUrl = baseUrl + '/' + res.request.uri.path;
            currentUrl = currentUrl.replace(/\/\//g, '/'), // Normalize double slash
            currentUrl = currentUrl.replace(/\/$/, ''), // Normalize trailing slash
            // console.log($('title').text().replace(titleBase, ''), '\t', currentUrl);
            queuedUrls.splice(queuedUrls.indexOf(currentUrl), 1);
            crawledUrls.push(currentUrl);

            if (crawledUrls.length % 50 === 0) {
                console.log(`Crawled ${crawledUrls.length} sites`);
            }

            let $links = $('a').filter((index, $link) => $link.attribs && $link.attribs.href
                && $link.attribs.href.indexOf('http') === -1);
            let urls = [];
            $links.each(function() {
                let url = baseUrl + '/' + $(this).attr('href');
                if (urls.indexOf(url) === -1 && crawledUrls.indexOf(url) === -1 && queuedUrls.indexOf(url) === -1) {
                    urls.push(url);
                }
            });
            if (urls.length) {
                queuedUrls = queuedUrls.concat(urls);
                c.queue(urls);
            }
        }
        done();
    }
});

// Queue just one URL, with default callback
c.queue(baseUrl);

c.on('drain',function(){
    let endDate = new Date();
    let duration = endDate - startDate;
    console.log(`Finished crawl, found ${crawledUrls.length} pages, it tool ${duration} ms.`);
});