<template>
  <div class="search-header">
    <!-- 搜索框 -->
    <div class="serch-header-input">
      <input
        class="search-input"
        type="text"
        autocomplete="off"
        v-model="searchValue"
        @focus="searchFocus"
        @blur="searchBlur"
        @keyup.enter="searchEnter"
      />
      <span class="search-icon" @click="searchEnter"></span>
    </div>
    <!-- 搜索建议 -->
    <template v-if="Object.keys(searchPropos).length">
      <ul class="search-list" v-show="searchProposShow">
        <li class="item-note" @click="jumpSearchUser">
          搜“{{ searchValue }}”相关用户 >
        </li>
        <!-- 单曲 -->
        <li class="item" v-if="searchPropos?.songs">
          <div class="title">
            <i class="title-icon songs-icon"></i>
            <span class="title-text">单曲</span>
          </div>
          <ul class="f-cb">
            <li
              class="f-cb-i"
              v-for="(item, index) in searchPropos.songs"
              :key="index"
              @click="jumpSongDetail(item.id)"
            >
              <span class="f-cb-text">
                {{ item?.name?.slice(0, searchValue.length) }}
              </span>
              <span>
                {{ item?.name?.slice(searchValue.length) }}-{{
                  item?.artists[0]?.name
                }}
              </span>
            </li>
          </ul>
        </li>
        <!-- 歌手 -->
        <li class="item" v-if="searchPropos?.artists">
          <div class="title">
            <i class="title-icon artists-icon"></i>
            <span class="title-text">歌手</span>
          </div>
          <ul class="f-cb f-cb-odd">
            <li
              class="f-cb-i"
              v-for="(item, index) in searchPropos.artists"
              :key="index"
              @click="jumpSingerDetail(item.id)"
            >
              <span class="f-cb-text">{{ item?.name }}</span>
            </li>
          </ul>
        </li>
        <!-- 专辑 -->
        <li class="item" v-if="searchPropos?.albums">
          <div class="title">
            <i class="title-icon albums-icon"></i>
            <span class="title-text">专辑</span>
          </div>
          <ul class="f-cb">
            <li
              class="f-cb-i"
              v-for="(item, index) in searchPropos.albums"
              :key="index"
              @click="jumpAlbumDetail(item.id)"
            >
              <span class="f-cb-text">
                {{ item.name.slice(0, searchValue.length) }}
              </span>
              <span>
                {{ item.name.slice(searchValue.length) }}-{{
                  item?.artist?.name
                }}
              </span>
            </li>
          </ul>
        </li>
        <!-- 歌单 -->
        <li class="item" v-if="searchPropos?.playlists">
          <div class="title">
            <i class="title-icon playlists-icon"></i>
            <span class="title-text">歌单</span>
          </div>
          <ul class="f-cb f-cb-odd">
            <li
              class="f-cb-i"
              v-for="(item, index) in searchPropos.playlists"
              :key="index"
              @click="jumpSongSheetDetail(item.id)"
            >
              <span class="f-cb-text">
                {{ item?.name?.slice(0, searchValue.length) }}
              </span>
              <span>
                {{ item?.name?.slice(searchValue.length) }}
              </span>
            </li>
          </ul>
        </li>
      </ul>
    </template>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { searchPropose } from '@api/search';
import type { ResponseType } from '@/types/types';

export default defineComponent({
  emits: ['searchEnter'],
  setup(props, { emit }) {
    const $router = useRouter();
    const $store = useStore();

    // 搜索详情关键字
    const searchDetailText = computed(() =>
      $store.getters.searchDetailText.replace(/"/g, '')
    );

    const searchValue = ref<string>(searchDetailText.value);
    const searchProposShow = ref<boolean>(false);
    // 搜索建议数据
    const searchPropos = ref<unknown>({});

    // 搜索框获取焦点
    function searchFocus(): void {
      if (searchValue.value) {
        searchProposShow.value = true;
        getSearchPropos();
      }
    }

    // 搜索框失去焦点
    function searchBlur(): void {
      // 延迟关闭，用于响应点击事件
      setTimeout(() => {
        searchProposShow.value = false;
      }, 150);
    }

    // 搜索框内容改变
    const oldSearchValue = ref<string>('');
    watch(
      () => searchValue.value,
      (curVal: string, oldVal: string) => {
        if (curVal) {
          getSearchPropos();
        } else {
          searchProposShow.value = false;
        }

        // 存储旧搜索内容
        if (oldVal) {
          oldSearchValue.value = oldVal;
        }
      }
    );

    // 搜索框回车
    function searchEnter(): boolean | undefined {
      searchProposShow.value = false;
      if (!searchValue.value) {
        return false;
      }

      // 搜索内容变化
      if (searchValue.value !== oldSearchValue.value) {
        emit('searchEnter', searchValue.value);
      }
    }

    // 获取搜索框建议
    function getSearchPropos(): void {
      searchPropose({
        keywords: searchValue.value
      })
        .then((res: ResponseType) => {
          if (res.code === 200) {
            searchPropos.value = res.result;
          }
        })
        .catch(() => ({}));
    }

    // 跳转搜索用户
    function jumpSearchUser(): void {
      // 存储关键字
      $store.commit('setSearchText', searchValue.value);
      $store.commit('setMenuIndex', -1);
      $store.commit('setSearchIndex', 7);

      $router.push({
        name: 'search-details',
        query: { searchText: searchValue.value }
      });
    }

    // 跳转歌曲详情
    function jumpSongDetail(id: number): void {
      $store.commit('jumpSongDetail', id);
    }

    // 跳转歌手详情
    function jumpSingerDetail(id: number): void {
      $store.commit('jumpSingerDetail', id);
    }

    // 跳转专辑详情
    function jumpAlbumDetail(id: number): void {
      $store.commit('jumpAlbumDetail', id);
    }

    // 跳转歌单详情
    function jumpSongSheetDetail(id: number): void {
      $store.commit('jumpSongSheetDetail', id);
    }

    return {
      searchValue,
      searchProposShow,
      searchPropos,
      searchFocus,
      searchBlur,
      searchEnter,
      jumpSearchUser,
      jumpSongDetail,
      jumpSingerDetail,
      jumpAlbumDetail,
      jumpSongSheetDetail
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./search-header.less');
</style>
