<template>
  <div class="loading" v-if="anchorData?.loading">
    <i class="loading-icon"></i>
    加载中...
  </div>
  <h2 class="search-anchor-title" v-if="!anchorData?.loading">声音主播</h2>
  <ul class="search-anchor-list" v-if="!anchorData?.loading">
    <li
      class="search-anchor-item"
      v-for="(item, index) in anchorData?.list"
      :key="index"
    >
      <div class="item-cover" @click="jumpDjradioDetail(item?.id)">
        <img
          class="item-cover-img"
          :src="`${item?.picUrl}?param=150y150`"
          alt=""
        />
      </div>
      <p class="desc" @click="jumpDjradioDetail(item?.id)">
        <span v-html="handleMatchString(item?.name, searchDetailText)"></span>
      </p>
      <p class="name" @click="jumpUserProfile(item?.dj?.userId)">
        <span class="by">by</span>
        <span class="text">
          <span
            v-html="handleMatchString(item?.dj?.nickname, searchDetailText)"
          ></span>
        </span>
        <i class="icon-sex male" v-if="item?.dj?.gender === 1"></i>
        <i class="icon-sex female" v-if="item?.dj?.gender === 2"></i>
      </p>
    </li>
  </ul>
  <Page
    v-if="anchorData.total > anchorData.limit"
    :page="anchorData.offset"
    :pageSize="anchorData.limit"
    :total="anchorData.total"
    @changPage="changPage"
  />
</template>

<script lang="ts">
import { defineComponent, reactive, computed, watch, toRefs } from 'vue';
import { useStore } from 'vuex';
import { timeStampToDuration, handleMatchString } from '@utils/utils';
import { setMessage } from '@/components/message/useMessage';
import { searchKeywords } from '@api/search';
import type { ResponseType } from '@/types/types';
import Page from '@components/page/Page.vue';

type AnchorData = {
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
        getSearchAnchor();
      }
    );

    const anchorData = reactive<AnchorData>({
      loading: true,
      offset: 1,
      limit: 30,
      total: 0,
      list: []
    });

    // 获取声音主播列表
    function getSearchAnchor(): void {
      searchKeywords({
        keywords: searchDetailText.value || searchText.value,
        offset: (anchorData.offset - 1) * anchorData.limit,
        limit: isLogin.value ? anchorData.limit : 20,
        type: 1009
      })
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            const total = isLogin.value
              ? res?.result?.djRadiosCount
              : res?.result?.djRadios.length;

            anchorData.total = total;
            anchorData.list = res?.result?.djRadios;

            emit('searchCountChange', total || 0);
          }

          anchorData.loading = false;
        })
        .catch(() => ({}));
    }
    getSearchAnchor();

    // 分页
    function changPage(current: number): void {
      anchorData.offset = current;
      getSearchAnchor();
    }

    // 跳转电台详情
    function jumpDjradioDetail(): void {
      setMessage({ type: 'error', title: '该功能暂未开发' });
    }

    // 跳转用户资料
    function jumpUserProfile(id: number): void {
      $store.commit('jumpUserProfile', id);
    }

    return {
      timeStampToDuration,
      handleMatchString,
      userInfo,
      anchorData,
      changPage,
      jumpDjradioDetail,
      jumpUserProfile
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./search-anchor.less');
</style>
