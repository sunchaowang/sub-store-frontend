import { useAppNotifyStore } from '@/store/appNotify';
import axios, { AxiosError, AxiosPromise, AxiosResponse } from 'axios';

let appNotifyStore = null;

const notifyConfig: { type: 'danger'; duration: number } = {
  type: 'danger',
  duration: 2500,
};
const uuidToken = localStorage.getItem('uuid');
// 配置新建一个 axios 实例
const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 50000,
  headers: { 'Content-Type': 'application/json;charset=UTF-8' },
});
service.interceptors.request.use((config) => {
  console.log('uuidToken', uuidToken);
  if (uuidToken) {
    if (config.method.toUpperCase() === 'GET') {
      config.params = { ...config.params, uuid: uuidToken };
    } else {
      config.data = { ...config.data, uuid: uuidToken };
    }

  }
  return config;
});

service.interceptors.response.use(
  (response: AxiosResponse<SucceedResponse>): AxiosPromise<SucceedResponse> => {
    // console.log('ddddddddd', response.data);
    return Promise.resolve(response);
  },
  (e: AxiosError<ErrorResponse>): AxiosPromise<ErrorResponse | undefined> => {
    // console.log('eeeeeeeee', e.response);

    // 流量信息接口的报错,不通知，直接返回
    if (e.config.url.startsWith('/api/sub/flow'))
      return Promise.resolve(e.response);

    if (appNotifyStore) {
      // 如果是网络错误，则提示网络错误
      if (e.response.status === 0) {
        appNotifyStore.showNotify({
          title: '网络错误，无法连接后端服务\n',
          content: 'code: ' + e.response.status + ' msg: ' + e.message,
          ...notifyConfig,
        });
        return Promise.reject(e.response);
      } else {
        let content = 'type: ' + e.response.data.error?.type;
        if (e.response.data.error?.details)
          content += '\n' + e.response.data.error.details;
        appNotifyStore.showNotify({
          title: e.response.data.error?.message,
          content,
          ...notifyConfig,
        });
        return Promise.resolve(e.response);
      }
    } else {
      appNotifyStore = useAppNotifyStore();
    }
  }
);

// 导出 axios 实例
export default service;
