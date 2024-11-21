import { resolve } from 'path';

const axios = require('axios');
const jwt = require('jsonwebtoken');

/* 生成token */
export function generateToken(apikey, expSeconds = 1000 * 60 * 60 * 24 * 360) {
  const [id, secret] = apikey.split('.');
  const payload = {
    api_key: id,
    exp: Math.round(Date.now()) + expSeconds * 1000,
    timestamp: Math.round(Date.now()),
  };
  // ts-ignore
  return jwt.sign(payload, secret, { algorithm: 'HS256', header: { alg: 'HS256', sign_type: 'SIGN' } });
}

/* 解析最后一次结果 */
export function compilerMetaJsonStr(data): any {
  let jsonStr = {};
  try {
    /*
      {
        task_status: 'SUCCESS',
        usage: { completion_tokens: 49, prompt_tokens: 719, total_tokens: 768 },
        task_id: '8008779509197849552',
        request_id: '8008779509197849552'
      }
    */
    jsonStr = JSON.parse(data);
  } catch (error) {
    /* 解析失败暂定一个固定值 待优化 */
    jsonStr = {
      usage: {
        completion_tokens: 49,
        prompt_tokens: 333,
        total_tokens: 399,
      },
    };
    console.error('json parse error from zhipu!', data);
  }
  return jsonStr;
}

/* 格式化信息并且输出为和百度一样的格式  前端不用变动了 */
export function compilerStream(streamArr) {
  console.log(streamArr, typeof streamArr);
  if (streamArr.length === 3) {
    return {
      event: streamArr[0].replace('event:', ''),
      id: streamArr[1].replace('id:', ''),
      is_end: false,
      result: streamArr[2].replace('data:', '').trim(),
    };
  }
  if (streamArr.length === 4) {
    return {
      event: streamArr[0].replace('event:', ''),
      id: streamArr[1].replace('id:', ''),
      result: streamArr[2].replace('data:', '').trim(),
      is_end: true,
      usage: compilerMetaJsonStr(streamArr[3].replace('meta:', ''))?.usage,
    };
  }
}

/* 格式化信息并且输出为和百度一样的格式  前端不用变动了 */
let lastStream = '';
export function compilerStreamV2(streamArr) {
  const generateRes = (str) => {
    if (str === '[DONE]') {
      return;
    }
    const parseData = JSON.parse(str);
    const { id, choices, usage } = parseData;
    const choice = choices?.[0];
    const { delta } = choice;
    const result = delta?.content;
    return {
      id,
      result,
      is_end: false,
      event: 'add',
      usage,
    };
  };

  const res = [];
  for (let i = 0; i < streamArr.length; i++) {
    const stream = streamArr[i];
    if (stream === '[DONE]' || !stream) {
      continue;
    }
    try {
      const str = lastStream + stream;
      const parseData = JSON.parse(str);
      lastStream = '';
      // console.log('parseData', str);
      res.push(generateRes(str));
    } catch (err) {
      lastStream += stream;
      console.log('error', lastStream, stream);
    }
  }

  return res;
}

export async function sendMessageFromZhipuV2(messagesHistory, { onProgress, key, model, temperature = 0.95, prompt }) {
  const token = await generateToken('8f0d5b5fb65e4ccca83963e9fd8f2d58.HzWdR5fkU2JK6p1b');
  return new Promise((resolve, reject) => {
    const url = `https://open.bigmodel.cn/api/paas/v4/assistant`;
    const options = {
      method: 'POST',
      url,
      responseType: 'stream',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${token}`,
      },
      data: {
        messages: messagesHistory,
        temperature,
        stream: true,
        assistant_id: '659e54b1b8006379b4b2abd6',
        model: 'glm-4-assistant',
      },
    };
    axios(options)
      .then((response) => {
        const stream = response.data;
        let resData;
        const cacheResText = '';
        stream.on('data', (chunk) => {
          // console.log('chunk', chunk.toString());
          const stramChunk = chunk
            .toString()
            .substring(6)
            .split('\n')
            .filter((line) => line.trim() !== '');

          const parseData = compilerStreamV2(stramChunk).filter((item) => item.result);
          // console.log('parseData', parseData);
          // if (!parseData?.length) return;
          // parseData.forEach((item) => {
          //   if (!item) return;
          //   const { result, is_end } = item;
          //   result && (cacheResText += result.trim());
          //   if (is_end) {
          //     item.is_end = false; //为了在后续的消费之后添加上余额 本次并不是真正的结束
          //     resData = item;
          //     resData.text = cacheResText;
          //   }
          //   onProgress(item);
          //   // console.log('item', item);
          // });
        });
        // stream.on('end', () => {
        //   console.log('end', resData);
        //   resolve(resData);
        //   cacheResText = '';
        // });
      })
      .catch((error) => {
        console.error('error: ', error);
      });
  });
}
