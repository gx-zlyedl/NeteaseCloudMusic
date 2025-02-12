<template>
  <div class="loading" v-if="mvData?.loading">
    <i class="loading-icon"></i>
    加载中...
  </div>
  <ul class="search-mv-list" v-if="!mvData?.loading">
    <li
      class="search-mv-item"
      v-for="(item, index) in mvData?.list"
      :key="index"
      :class="{ 'first-item': index % 5 }"
    >
      <div class="cover" @click="jumpVideoDetail(item?.type, item?.vid)">
        <img class="img" :src="item?.coverUrl" alt="" />
        <div class="play-volume">
          <span class="icon-mv"></span>
          <span class="text">{{ bigNumberTransform(item?.playTime) }}</span>
        </div>
        <div class="duration">
          {{ timeStampToDuration(item?.durationms / 1000) }}
        </div>
      </div>
      <div class="item-title">
        <i class="icon" v-if="item?.type === 0"></i>
        <span
          :title="item?.title"
          @click="jumpVideoDetail(item?.type, item?.vid)"
        >
          <span
            v-html="handleMatchString(item?.title, searchDetailText)"
          ></span>
        </span>
      </div>
      <div class="item-name">
        <span class="text" v-if="item?.type !== 0">by</span>
        <span
          class="name"
          :title="item?.creator[0]?.userName"
          @click="jumpSingerDetail(item?.creator[0]?.userId)"
        >
          {{ item?.creator[0]?.userName }}
        </span>
      </div>
    </li>
  </ul>
  <Page
    v-if="mvData.total > mvData.limit"
    :page="mvData.offset"
    :pageSize="mvData.limit"
    :total="mvData.total"
    @changPage="changPage"
  />
</template>

<script lang="ts">
import { defineComponent, reactive, computed, watch, toRefs } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import {
  bigNumberTransform,
  timeStampToDuration,
  handleMatchString
} from '@utils/utils';
import { searchKeywords } from '@api/search';
import type { ResponseType } from '@/types/types';
import Page from '@components/page/Page.vue';

type MvData = {
  loading: boolean;
  offset: number;
  limit: number;
  total: number;
  list: unknown[];
};

export default defineComponent({
  components: {
    Page
  },
  props: {
    searchDetailText: {
      type: String,
      default: ''
    }
  },
  emits: ['searchCountChange'],
  setup(props, { emit }) {
    const $router = useRouter();
    const $store = useStore();

    const { searchDetailText } = toRefs(props);

    const isLogin = computed<boolean>(() => $store.getters.isLogin);
    const userInfo = computed(() => $store.getters.userInfo);
    // 搜索关键词
    const searchText = computed<string>(() =>
      $store.getters.searchText.replace(/"/g, '')
    );

    watch(
      () => searchDetailText.value,
      () => {
        getSearchMv();
      }
    );

    const mvData = reactive<MvData>({
      loading: true,
      offset: 1,
      limit: 30,
      total: 0,
      list: []
    });

    // 获取视频列表
    function getSearchMv(): void {
      searchKeywords({
        keywords: searchDetailText.value || searchText.value,
        offset: (mvData.offset - 1) * mvData.limit,
        limit: isLogin.value ? mvData.limit : 20,
        type: 1014
      })
        .then((res: ResponseType) => {
          if (res.code === 200) {
            const total = isLogin.value
              ? res?.result?.videoCount
              : res?.result?.videos.length;

            mvData.total = total;
            mvData.list = res?.result?.videos;

            emit('searchCountChange', total || 0);
          }

          mvData.loading = false;
        })
        .catch(() => ({}));
    }
    getSearchMv();

    // 分页
    function changPage(current: number): void {
      mvData.offset = current;
      getSearchMv();
    }

    // 跳转视频详情
    function jumpVideoDetail(type: number, id: number): void {
      // type 0为mv, 1为视频
      if (type === 0) {
        $router.push({ name: 'mv-detail', params: { id } });
      }

      if (type === 1) {
        $router.push({ name: 'video-detail', params: { id } });
      }

      $store.commit('video/setVideo', { id, url: '' });
    }

    // 跳转歌手详情
    function jumpSingerDetail(id: number): void {
      $store.commit('jumpSingerDetail', id);
    }

    return {
      bigNumberTransform,
      timeStampToDuration,
      handleMatchString,
      userInfo,
      mvData,
      changPage,
      jumpVideoDetail,
      jumpSingerDetail
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./search-mv.less');
</style>
