import * as fetch from "node-fetch";
import * as cheerio from "cheerio";
import * as fs from "fs";
import * as path from "path";
import * as urlParser from "url";

const seenUrls = {};
// sample url
const SET_URL = "http://stevescooking.blogspot.com/";

const getUrl = (link, host, protocol) => {
  // filters the url for image, and makes sure that we can access all the given links
  if (link.includes("http")) {
    // traverses through links
    return link;
  } else if (link.startsWith("/")) {
    // returns image
    return `${protocol}//${host}${link}`;
  } else {
    // returns image
    return `${protocol}//${host}/${link}`;
  }
};

const crawl = async ({ url, ignore }) => {
  if (seenUrls[url]) return;
  // if the url is not visited then calls the dfs
  console.log("crawling", url);
  seenUrls[url] = true;

  const { host, protocol } = urlParser.parse(url);

  const response = await fetch(url);
  const html = await response.text();
  const $ = cheerio.load(html);
  // this is an array which contains the found links which are not images
  const links = $("a")
    .map((i, link) => link.attribs.href)
    .get();
  // array containing all the image URLs
  const imageUrls = $("img")
    .map((i, link) => link.attribs.src)
    .get();

  imageUrls.forEach((imageUrl) => {
    // fetches the image from the imageUrl array and saves them in the local storage
    fetch(getUrl(imageUrl, host, protocol)).then((response) => {
      const filename = path.basename(imageUrl);
      const dest = fs.createWriteStream(`images/${filename}`);
      response.body.pipe(dest);
    });
  });

  links
    .filter((link) => link.includes(host) && !link.includes(ignore))
    // traverses the links array and calls the dfs
    .forEach((link) => {
      crawl({
        url: getUrl(link, host, protocol),
        ignore,
      });
    });
};

crawl({
  url: SET_URL,
  ignore: "/search",
});

// Overall complexity: O(N)
// where N is the number of accessible pages from SET_URL
