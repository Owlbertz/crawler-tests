/* eslint-env phantomjs */

/* globals document: true */

var phantomAPI = require("phantom"),
    Crawler = require("simplecrawler"),
    colors = require("colors/safe"),
    phantomjs = require("phantomjs");
const cheerio = require('cheerio');
const fs = require('fs');

var crawler = new Crawler("http://quotes.toscrape.com/js"),
    phantomBin = phantomjs.path,
    phantomBannedExtensions = /\.(png|jpg|jpeg|gif|ico|css|js|csv|doc|docx|pdf)$/i,
    phantomQueue = [];


crawler.useProxy = true;
crawler.proxyHostname = '172.20.1.13';
crawler.proxyPort = 8888;

crawler.interval = 0;
phantomAPI.create(['--proxy=http://172.20.1.13:8888'], { binary: phantomBin }).then(runCrawler);

console.log('Created');


let RESULT = [];
// crawler.on("complete", process.exit.bind(process, 0));

function save(callback) {
    fs.writeFile('result.json', JSON.stringify(RESULT), () => {
        console.log('Saved', RESULT.lenght, 'quotes');
        callback();
    });
}

function runCrawler(phantom) {
    crawler.start();
    console.log('Started');
    crawler.on("queueadd", function (queueItem) {
        if (!queueItem.url.match(phantomBannedExtensions)) {
            var resume = this.wait();
            phantomQueue.push(queueItem.url);
            processQueue(phantom, resume);
        }
    });
}

function getLinks(phantom, url, callback) {
    console.log(colors.green("Phantom attempting to load ") + colors.cyan("%s"), url);

    makePage(phantom, url, function (page, status) {
        console.log(
            colors.green("Phantom opened URL with %s — ") + colors.cyan("%s"), status, url);

        page.evaluate(extractContent).then(function (result) {
            RESULT = RESULT.concat(result);
            return page.evaluate(findPageLinks)
        }).then(function (urls) {
            urls.forEach(function (url) {
                crawler.queueURL(url);
            });
            callback();
        });
    });
}

function extractContent() {
    console.log('Called extractContent');
    var quotes = document.querySelectorAll('.quote');
    quotes = [].slice.call(quotes);
    return quotes.map(function (ele) {
        var quote = {
            author: ele.querySelector('.author').innerHTML,
            text: ele.querySelector('.text').innerHTML
        };
        return quote;
    });
}

function findPageLinks() {
    var selector = document.querySelectorAll("a, link, img");
    selector = [].slice.call(selector);

    return selector
        .map(function (link) {
            return link.href || link.onclick || link.href || link.src;
        })
        .filter(function (src) {
            return Boolean(src);
        });
}

function makePage(phantom, url, callback) {
    phantom.createPage().then((page) => {
        page.setting('javascriptEnabled').then(() => page.open(url)).then(function (status) {
            callback(page, status);
        });
    });
}

var queueBeingProcessed = false;
function processQueue(phantom, resume) {
    if (queueBeingProcessed) {
        return;
    }
    queueBeingProcessed = true;

    (function processor(item) {
        if (!item) {
            console.log(colors.green("Phantom reached end of queue! ------------"));
            queueBeingProcessed = false;
            return save(resume);
            return resume();
        }

        getLinks(phantom, item, function () {
            // Break up stack so we don't blow it
            setTimeout(processor.bind(null, phantomQueue.shift()), 10);
        });

    })(phantomQueue.shift());
}