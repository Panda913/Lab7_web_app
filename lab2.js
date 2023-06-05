const cheerio = require('cheerio');
const fs = require('fs');
const net = require('net');
const request = require("request")
const path = require('path');

const NEWS_DIRECTORY = 'news';
const url = 'https://www.wsj.com/';


function webScraper() {

    request(url, function (error, response, html) {
        if (!error) {
            const $ = cheerio.load(html);
            $('.WSJTheme--story--XB4V2mLz').each(function () {

                const title = $(this).find('h3').text();
                const link = $(this).find('a').attr('href');
                const info = $(this).find('p').text();
                saveNews(title, info, link);
            });
        } else {

        }

    });

}

setInterval(webScraper, 60000);

function saveNews(title, info, url) {
    fs.mkdirSync(NEWS_DIRECTORY, {recursive: true});
    let fileContent;
    const fileName = title.toLowerCase().replace(/[^a-zA-Z0-9 ]|\s+/g, '_') + '.txt';
    if (info.length > 0) {
        fileContent = `Title: ${title}\n\nURL: ${url}\n\nNews: ${info}\n\n`;
    } else {
        fileContent = `Title: ${title}\n\nURL: ${url}\n\n`;
    }
    fs.writeFile(`${NEWS_DIRECTORY}/${fileName}`, fileContent, err => {
        if (err) {
            console.error(err);
        } else {
            console.log(`Saved ${fileName}`);
        }
    });

}


const server = net.createServer((socket) => {
    socket.setEncoding('utf-8');
    socket.on('data', (data) => {
        const request = data.toString();
        const requestLine = request.split('\n')[0];
        const requestParts = requestLine.split(' ');

        // Відображення списку файлів у директорії
        if (requestParts[0] === 'GET' && requestParts[1] === '/') {
            fs.readdir(NEWS_DIRECTORY, (err, files) => {
                if (err) {
                    socket.write('HTTP/1.1 500 Internal Server Error\n');
                    socket.write('Content-Type: text/plain\n\n');
                    socket.write('Internal Server Error');
                    socket.end();
                    return;
                }

                socket.write('HTTP/1.1 200 OK\n');
                socket.write('Content-Type: text/html\n\n');
                socket.write('<ul>');
                files.forEach((file) => {
                    const filePath = path.join(NEWS_DIRECTORY, file);
                    const fileStats = fs.statSync(filePath);
                    if (fileStats.isFile()) {
                        socket.write(`<li><a href="/news/${file}">${file}</a></li>`);
                    }
                });
                socket.write('</ul>');
                socket.end();
            });
        }
        // Відображення тексту новини
        else if (requestParts[0] === 'GET' && requestParts[1].startsWith('/news/')) {

            const fileName = requestParts[1].substring('/news/'.length);
            console.log(fileName);

            fs.readFile(NEWS_DIRECTORY + '/' + fileName, 'utf-8', (err, data) => {
                if (err) {
                    socket.write('HTTP/1.1 404 Not Found\n');
                    socket.write('Content-Type: text/plain\n\n');
                    socket.write('Not Found');
                    socket.end();
                    return;
                }

                socket.write('HTTP/1.1 200 OK\n');
                socket.write('Content-Type: text/html\n\n');
                socket.write(data);
                socket.end();
            });
        }
        // Обробка інших запитів
        else {
            socket.write('HTTP/1.1 404 Not Found\n');
            socket.write('Content-Type: text/plain\n\n');
            socket.write('Not Found');
            socket.end();
        }
    });
});
webScraper()
server.listen(8081, () => {
    console.log('Server running on port 8081');
});


