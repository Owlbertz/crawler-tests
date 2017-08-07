const Crawler = require('simplecrawler');
const crawler = new Crawler('http://localhost/tests/sitemap/index.html');

crawler.start();
crawler.on('fetchcomplete', function (queueItem, responseBuffer, response) {
    console.log('Dokument heruntergeladen:', queueItem.id, queueItem.url);
    // Weitere Verarbeitung des Dokuments...
});