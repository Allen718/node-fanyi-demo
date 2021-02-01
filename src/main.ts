import * as https from "https";
import * as querystring from "querystring";
import md5 = require("md5");
import {appId, appSecret} from "./private";

export const translate = (word:string) => {
  type ErrorMap={
   [key:string]:string,
  }
  const errorMap:ErrorMap = {
    52001: '请求超时',
    52002: '系统错误',
    52003: '未授权用户',
    54000: '必填参数为空',
    54001: '签命名错误',
    54003: '访问频率受限',
    54004: '账户余额不足',
    54005: '长query请求频繁',
    58000: '客户端IP非法',
    58001: '译文语言不支持',
    58002: '服务当前已关闭'
  }
  let from, to;
  if (/[a-zA-Z]/.test(word)) {
    from = 'en';
    to = 'zh'
  } else {
    from = 'zh'
    to = 'en';
  }
  const salt = Math.random()
  const sign = md5(appId + word + salt + appSecret)
  const queryString: string = querystring.stringify({
    q: word,
    from,
    to,
    appid: appId,
    salt,
    sign
  });

  const options = {
    hostname: 'api.fanyi.baidu.com',
    port: 443,
    path: '/api/trans/vip/translate?' + queryString,
    method: 'GET'
  };

  const request = https.request(options, (response) => {
    // console.log('状态码:', response.statusCode);
    // console.log('请求头:', response.headers);
    const chucks:Buffer[] = [];
    response.on('data', (data) => {
      chucks.push(data)
      // process.stdout.write(d);
    });
    response.on('end', () => {
      const string = Buffer.concat(chucks).toString()
      type BaiduResult = {
        error_code?: string,
        error_message?: string,
        trans_result: {
          src: string,
          dst: string,
        }[],
      }
      const obj: BaiduResult = JSON.parse(string)
      if (obj.error_code) {
        if (obj.error_code in errorMap) {
          console.error(errorMap[obj.error_code])
        } else {
          console.error(obj.error_message)
        }
        process.exit(3)
      } else {
        console.log(obj.trans_result[0].dst)
        process.exit(0)
      }

    })
  });

  request.on('error', (e) => {
    console.error(e);
  });
  request.end();
}
