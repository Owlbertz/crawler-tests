const Crawler = require('simplecrawler');
const crawler = new Crawler('http://quotes.toscrape.com/');
const cheerio = require('cheerio')


crawler.useProxy = true;
crawler.proxyHostname = '172.20.1.13';
crawler.proxyPort = 8888;

crawler.addFetchCondition(function (queueItem, referrerQueueItem, callback) {
    callback(null, queueItem.path.match(/^\/page\//i));
});


const result = [];
const startDate = new Date();

crawler.on('fetchcomplete', function (queueItem, responseBuffer, response) {
    // console.log('Dokument heruntergeladen:', queueItem.id, queueItem.path);
    let content = responseBuffer.toString('utf8');
    let $ = cheerio.load(content);

    let quotes = $('.quote');
    $('.quote').each(function() {
        let quote = {
            author: $(this).find('.author').text(),
            text: $(this).find('.text').text()
        };
        result.push(quote);
    });
});


crawler.on('complete', function () {
    console.log(result.length + ' Quotes found');
    // console.log(result);

    const endDate = new Date();
    const duration = endDate - startDate;
    console.log('Crawling took ' + duration + 'ms');
});

crawler.start();

// crawler.on('fetchtimeout', function () {
//     console.log('fetchtimeout:', arguments);
// });
// crawler.on('fetchdataerror', function () {
//     console.log('fetchdataerror:', arguments);
// });
// crawler.on('fetcherror', function () {
//     console.log('fetcherror:', arguments);
// });
// crawler.on('fetchclienterror', function () {
//     console.log('fetchclienterror:', arguments);
// });
// crawler.on('fetchprevented', function () {
//     console.log('fetchprevented:', arguments);
// });