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
  const baseUrl = processedUrl || 'http://172.245.57.223:8030/v1';
  return baseUrl;
}

let lastString = '';

const token =
  'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJ1c2VyLWNlbnRlciIsImV4cCI6MTcyMjQxNzExOSwiaWF0IjoxNzE0NjQxMTE5LCJqdGkiOiJjb3BsaG5xdWw3MjI3dG9zODNyMCIsInR5cCI6InJlZnJlc2giLCJzdWIiOiJjbXE2Zjk2Y3A3ZmR2cjE0dGNsZyIsInNwYWNlX2lkIjoiY21xNmY5NmNwN2ZkdnIxNHRjbDAiLCJhYnN0cmFjdF91c2VyX2lkIjoiY21xNmY5NmNwN2ZkdnIxNHRja2cifQ.uDmwP-IlsJfDaVA1KEQgfNbTSB1yXv_D_8vbwz7d2_ysDY4ACbksChlXZbnApUte0hGh3jJabD2VZWui1vBEWQ';

export function sendMessageFromKimi(messagesHistory, inputs) {
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
    data: {
      max_tokens,
      temperature,
      model: 'kimi',
      messages: messagesHistory,
      use_search: true,
    },
  };
  const prompt = messagesHistory[messagesHistory.length - 1]?.content;
  return new Promise(async (resolve, reject) => {
    try {
      const response: any = await axios(options);
      const data = response.data;
      const text = data.choices[0]?.message?.content || '';
      const result = { text, detail: { usage: null }, id: data?.id };

      const promptTokens = getTokenCount(prompt);
      const completionTokens = getTokenCount(text);
      result.detail.usage = {
        prompt_tokens: data.usage.prompt_tokens,
        completion_tokens: data.usage.completionTokens,
        total_tokens: promptTokens + completionTokens,
        estimated: true,
      };
      return resolve(result);
    } catch (error) {
      lastString = '';
      reject(error);
    }
  });
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
