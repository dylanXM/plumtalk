import { GLM_TOKEN } from '@/config/main';
import { HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosRequestConfig } from 'axios';

function getFullUrl(proxyUrl = '') {
  const processedUrl = proxyUrl.endsWith('/') ? proxyUrl.slice(0, -1) : proxyUrl;
  const baseUrl = processedUrl || 'http://172.245.57.223:8020/v1';
  return baseUrl;
}

const token =
  GLM_TOKEN ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTcxNTM1MDQyNCwianRpIjoiMjNlZjJjMzktNzczZS00Yjc2LWEzYzgtNzEwMDk2MWEyNWQ1IiwidHlwZSI6InJlZnJlc2giLCJzdWIiOiJkNDAyNTZjODg1OTA0OGMwODY1ZWNkZGU4ZWJkNzk0NSIsIm5iZiI6MTcxNTM1MDQyNCwiZXhwIjoxNzMwOTAyNDI0LCJ1aWQiOiI2NWQwOTIwNWNlMjhkZjlkNjkzMjk5M2IiLCJ1cGxhdGZvcm0iOiJpT1MiLCJyb2xlcyI6WyJ1bmF1dGhlZF91c2VyIl19.DyKKHWfvOn39WXW-jeHNw3EE1bEOnKvByPokfHyTkrI';

export function parse(messagesHistory, inputs: any) {
  const { proxyResUrl, keyId } = inputs || {};
  const options: AxiosRequestConfig = {
    method: 'POST',
    url: `${getFullUrl(proxyResUrl)}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: {
      id: '66402bcb73e16cd2f8b1bcec',
      model: '66402bcb73e16cd2f8b1bcec',
      messages: messagesHistory,
    },
  };
  return new Promise(async (resolve, reject) => {
    try {
      const response: any = await axios(options);
      const data = response.data;
      const text = data.choices[0]?.message?.content || '';
      const result = { text, id: data?.id };
      return resolve(result);
    } catch (error) {
      const status = error?.response?.status || 500;
      const message = error?.response?.data?.error?.message;
      if (status === 429) {
        throw new HttpException('当前请求已过载、请稍等会儿再试试吧！', HttpStatus.BAD_REQUEST);
      }
      if (status === 400 && message.includes('This request has been blocked by our content filters')) {
        throw new HttpException('您的请求已被系统拒绝。您的提示可能存在一些非法的文本。', HttpStatus.BAD_REQUEST);
      }
      if (status === 400 && message.includes('Billing hard limit has been reached')) {
        await this.modelsService.lockKey(keyId, '当前模型key已被封禁、已冻结当前调用Key、尝试重新对话试试吧！', -1);
        throw new HttpException('当前Key余额已不足、请重新再试一次吧！', HttpStatus.BAD_REQUEST);
      }
      if (status === 500) {
        throw new HttpException('解析失败，请检查你的提示词是否有非法描述！', HttpStatus.BAD_REQUEST);
      }
      if (status === 401) {
        throw new HttpException('解析失败，此次解析被拒绝了！', HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('解析失败，请稍后试试吧！', HttpStatus.BAD_REQUEST);
    }
  });
}
