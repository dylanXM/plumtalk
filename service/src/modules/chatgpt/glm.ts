import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { get_encoding } from '@dqbd/tiktoken';
import { removeSpecialCharacters } from '@/common/utils';

const tokenizer = get_encoding('cl100k_base');

interface SendMessageResult {
  id?: string;
  text: string;
  role?: string;
  detail?: any;
}

function getFullUrl(proxyUrl = '') {
  const processedUrl = proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl;
  const baseUrl = processedUrl || 'http://172.245.57.223:8020/v1';
  return baseUrl;
}

let lastString = '';

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxNTM1MDQyNCwianRpIjoiMjNlZjJjMzktNzczZS00Yjc2LWEzYzgtNzEwMDk2MWEyNWQ1IiwidHlwZSI6InJlZnJlc2giLCJzdWIiOiJkNDAyNTZjODg1OTA0OGMwODY1ZWNkZGU4ZWJkNzk0NSIsIm5iZiI6MTcxNTM1MDQyNCwiZXhwIjoxNzMwOTAyNDI0LCJ1aWQiOiI2NWQwOTIwNWNlMjhkZjlkNjkzMjk5M2IiLCJ1cGxhdGZvcm0iOiJpT1MiLCJyb2xlcyI6WyJ1bmF1dGhlZF91c2VyIl19.DyKKHWfvOn39WXW-jeHNw3EE1bEOnKvByPokfHyTkrI';

export function sendMessageFromGlm(messagesHistory, inputs) {
  const { onProgress, maxToken, apiKey, model, temperature = 0.95, proxyUrl } = inputs;
  const max_tokens = compilerToken(model, maxToken);
  console.log('max_tokens: ', inputs);
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: `${getFullUrl(proxyUrl)}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    responseType: 'stream',
    data: {
      id: '66402bcb73e16cd2f8b1bcec',
      max_tokens,
      temperature,
      model: '66402bcb73e16cd2f8b1bcec',
      messages: messagesHistory,
      use_search: true,
      stream: true,
    },
  };
  const prompt = messagesHistory[messagesHistory.length - 1]?.content;
  return new Promise(async (resolve, reject) => {
    try {
      const response: any = await axios(options);
      const stream = response.data;
      const result: any = { text: '' };
      stream.on('data', (chunk) => {
        const splitArr = chunk
          .toString()
          .split('\n\n')
          .filter((line) => line.trim() !== '');
        for (const line of splitArr) {
          const data = line.replace('data:', '');
          let ISEND = false;
          try {
            ISEND = JSON.parse(data).choices[0].finish_reason === 'stop';
          } catch (error) {
            ISEND = false;
          }
          /* 如果结束 返回所有 */
          if (data === '[DONE]' || ISEND) {
            result.text = result.text.trim();
            lastString = '';
            return result;
          }
          try {
            const newData = lastString + data;
            const parsedData = JSON.parse(newData);
            lastString = '';
            if (parsedData.id) {
              result.id = parsedData.id;
            }
            if (parsedData.choices?.length) {
              const delta = parsedData.choices[0].delta;
              result.delta = delta.content;
              if (delta?.content) result.text += delta.content;
              if (delta.role) {
                result.role = delta.role;
              }
              result.detail = parsedData;
            }
            onProgress && onProgress({ text: result.text });
          } catch (error) {
            console.log('parse error: ', data, lastString + data);
            lastString += data;
          }
        }
      });

      stream.on('end', () => {
        if (result.detail && result.text) {
          const promptTokens = getTokenCount(prompt);
          const completionTokens = getTokenCount(result.text);
          result.detail.usage = {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
            estimated: true,
          };
        }
        lastString = '';
        return resolve(result);
      });
    } catch (error) {
      lastString = '';
      reject(error);
    }
  });
}

export async function drawImageFromGlm(prompt) {
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: `${getFullUrl()}/images/generations`,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    data: {
      prompt,
      model: 'cogview-3',
    },
  };
  console.log('options: ', options);
  return axios(options);
}

export function getTokenCount(text = '') {
  if (!text) return 0;
  text = text.replace(/<\|endoftext\|>/g, '');
  return tokenizer.encode(text).length;
}

function compilerToken(model, maxToken) {
  let max = 0;

  /* 3.5 */
  if (model.includes(3.5)) {
    max = maxToken > 4096 ? 4096 : maxToken;
  }

  /* 4.0 */
  if (model.includes('gpt-4')) {
    max = maxToken > 8192 ? 8192 : maxToken;
  }

  /* 4.0 preview */
  if (model.includes('preview')) {
    max = maxToken > 4096 ? 4096 : maxToken;
  }

  /* 4.0 32k */
  if (model.includes('32k')) {
    max = maxToken > 32768 ? 32768 : maxToken;
  }

  return max;
}
