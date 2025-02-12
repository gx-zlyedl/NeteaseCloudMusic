import axios from '@utils/axios';
import type { AxiosPromise } from 'axios';

/**
 * @description 获取电台分类列表
 * @param { Number } timestamp - 防止接口缓存
 */
export const djCatelist = (): AxiosPromise => {
  const params = {
    timestamp: new Date().getTime()
  };
  return axios.request({
    url: '/dj/catelist',
    method: 'get',
    params
  });
};

// 推荐节目
export const programRecommend = (): AxiosPromise => {
  const params = {
    timestamp: new Date().getTime()
  };
  return axios.request({
    url: '/program/recommend',
    method: 'get',
    params
  });
};

// 节目排行榜
export type TopListType = {
  limit?: number;
  offset?: number;
};
export const programTopList = ({
  limit,
  offset
}: TopListType): AxiosPromise => {
  const params = {
    timestamp: new Date().getTime(),
    limit,
    offset
  };
  return axios.request({
    url: '/dj/program/toplist',
    method: 'get',
    params
  });
};

// 分类推荐
export type RecommendType = {
  type: number;
};
export const recommendTypeList = ({ type }: RecommendType): AxiosPromise => {
  const params = {
    timestamp: new Date().getTime(),
    type
  };
  return axios.request({
    url: '/dj/recommend/type',
    method: 'get',
    params
  });
};

// 电台详情
export type DjDetailType = {
  rid: number;
};
export const djDetail = ({ rid }: DjDetailType): AxiosPromise => {
  const params = {
    timestamp: new Date().getTime(),
    rid
  };
  return axios.request({
    url: '/dj/detail',
    params
  });
};

// 电台详情- 节目列表
export type DjProgramType = {
  rid: number;
  asc: boolean;
  limit?: number;
  offset?: number;
};
export const djProgram = ({
  rid,
  asc,
  limit,
  offset
}: DjProgramType): AxiosPromise => {
  const params = {
    timestamp: new Date().getTime(),
    rid,
    asc,
    limit,
    offset
  };
  return axios.request({
    url: '/dj/program',
    params
  });
};
