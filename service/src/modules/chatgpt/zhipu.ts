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
      event: 'add',
      usage,
    };
  };

  const res = [];
  for (let i = 0; i < streamArr.length; i++) {
    const stream = streamArr[i].startsWith('data:') ? streamArr[i].slice(5) : streamArr[i];
    if (stream.trim() === '[DONE]' || !stream) {
      continue;
    }
    try {
      const str = lastStream + stream;
      const parseData = JSON.parse(str);
      lastStream = '';
      const currentRes = generateRes(str);
      res.push(currentRes);
    } catch (err) {
      lastStream += stream;
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
        let cacheResText = '';
        stream.on('data', (chunk) => {
          const stramChunk = chunk
            .toString()
            .split('\n')
            .filter((line) => line.trim() !== '');

          const parseData = compilerStreamV2(stramChunk).map((item) => (!item.result ? { ...item, result: '' } : item));
          if (!parseData?.length) return;
          parseData.forEach((item) => {
            if (!item) return;
            const { result } = item;
            cacheResText += result.trim();
            resData = item;
            resData.text = cacheResText;
            onProgress(item);
          });
        });
        stream.on('end', () => {
          resolve(resData);
          cacheResText = '';
        });
      })
      .catch((error) => {
        console.error('error: ', error);
      });
  });
}
