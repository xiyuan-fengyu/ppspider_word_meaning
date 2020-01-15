import {AddToQueue, appInfo, FromQueue, Job, OnStart, RequestUtil} from "ppspider";
import * as Cheerio from "cheerio";
import * as fs from "fs";

export class ChineseTask {

    @OnStart({urls: "https://www.zdic.net/hans/%E4%BA%BA"})
    @FromQueue({name: "chinese_characters", parallel: 2, exeInterval: 500})
    @AddToQueue([
        {name: "chinese_characters"},
        {name: "chinese_words"}
    ])
    async character(job: Job) {
        const $ = await ChineseTask.getHtml(job.url);
        const addToQueue = {
            chinese_characters: [],
            chinese_words: []
        };
        // await FileUtil.write(appInfo.workplace + "/character.html", $("html").html());
        $(".crefe a[href^='/hans/']").each((index, ele) => {
            const $ele = $(ele);
            const text = $ele.text().trim();
            if (text.length) {
                addToQueue.chinese_words.push(`https://www.zdic.net/hans/${encodeURIComponent(text)}`);
                for (let c of text) {
                    addToQueue.chinese_characters.push(`https://www.zdic.net/hans/${encodeURIComponent(c)}`);
                }
            }
        });
        return addToQueue;
    }

    @FromQueue({name: "chinese_words", parallel: 2, exeInterval: 500})
    async word(job: Job) {
        const word = decodeURIComponent(job.url.substring(job.url.lastIndexOf("/") + 1));
        const $ = await ChineseTask.getHtml(job.url);
        // await FileUtil.write(appInfo.workplace + "/word.html", $("html").html());
        // 可能存在一词多义
        const meanings: {en: string, cn: string}[] = [];
        $(".definitions p .encs").each((index, encs) => {
            const $encs = $(encs);
            const en = $encs.text().trim().replace(/^\[|]$/g, "");
            const $encsParent = $encs.parent();
            $encsParent.find("span").remove();
            const cn = $encsParent.text().trim().replace(/^∶/, "");
            if (en && cn) {
                meanings.push({en, cn});
            }
        });
        if (meanings.length) {
            const str = meanings.map(item => word + "\t" + item.en + "\t" + item.cn + "\n").join("");
            await new Promise((resolve, reject) => {
                fs.appendFile(appInfo.workplace + "/chinese_words.txt", str, err => err ? reject(err) : resolve());
            });
        }
    }

    private static async getHtml(url: string) {
        const res = await RequestUtil.simple({
            url: url,
            headerLines: `
            accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
            accept-encoding: gzip, deflate, br
            accept-language: zh-CN,zh;q=0.9
            cache-control: max-age=0
            cookie: _ga=GA1.2.113237183.1579066769; _gid=GA1.2.2077441195.1579066769; yewwplastsearchtime=1579066828; yewwplastschalltime=1579068185; yewwpecookieinforecord=%2C8-113515%2C8-313786%2C3-1%2C8-662037%2C8-661811%2C8-360845%2C3-187%2C8-330564%2C8-309759%2C8-19335%2C8-114475%2C; _gat_gtag_UA_161009_3=1
            sec-fetch-mode: navigate
            sec-fetch-site: none
            sec-fetch-user: ?1
            upgrade-insecure-requests: 1
            user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36
            `
        });
        return Cheerio.load(res.body);
    }

}
