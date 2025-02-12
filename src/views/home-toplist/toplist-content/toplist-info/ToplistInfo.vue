<template>
  <div class="toplist-user-info">
    <div class="header-info">
      <div class="info-img">
        <template v-if="songSheetDetail?.playlist?.coverImgUrl">
          <img
            class="img"
            :src="`${songSheetDetail?.playlist?.coverImgUrl}?param=200y200`"
            alt=""
          />
        </template>
        <template>
          <img class="img" src="" alt="" />
        </template>
        <i class="icon"></i>
      </div>
      <div class="info-right">
        <div class="title">
          <h2 class="title-text">{{ songSheetDetail?.playlist?.name }}</h2>
        </div>
        <div class="info">
          <i class="icon"></i>
          <span class="time">
            最近更新：{{
              formatDateTime(
                songSheetDetail?.playlist?.updateTime / 1000,
                'MM月dd日'
              )
            }}
          </span>
          <span class="desc">（{{ updateFrequency }}）</span>
        </div>
        <div class="operate-btn">
          <div
            class="play"
            :class="{
              'disable-play': songSheetDetail?.playlist?.tracks.length === 0
            }"
            title="播放"
            @click="playAllMusic"
          >
            <span class="icon-play">播放</span>
          </div>
          <div
            class="play-add"
            :class="{
              'disable-play-add': songSheetDetail?.playlist?.tracks.length === 0
            }"
            title="添加到播放列表"
            @click="allMusicToPlayList"
          ></div>
          <div
            class="other collection"
            :class="`${isLogin ? 'disable-collection' : ''}`"
            @click="handleCollection"
          >
            <template v-if="songSheetDetail?.playlist?.subscribedCount > 0">
              <span class="icon">
                ({{ songSheetDetail?.playlist?.subscribedCount }})
              </span>
            </template>
            <template v-else>
              <span class="icon">收藏</span>
            </template>
          </div>
          <div
            class="other share"
            :class="{
              'disable-share': songSheetDetail?.playlist?.tracks.length === 0
            }"
            @click="handleShare"
          >
            <template v-if="songSheetDetail?.playlist?.shareCount > 0">
              <span class="icon">
                ({{ songSheetDetail?.playlist?.shareCount }})
              </span>
            </template>
            <template v-else>
              <span class="icon">分享</span>
            </template>
          </div>
          <div
            class="other download"
            :class="{
              'disable-download': songSheetDetail?.playlist?.tracks.length === 0
            }"
            @click="handleDownload"
          >
            <span class="icon">下载</span>
          </div>
          <div
            class="other comment"
            :class="{
              'disable-comment': songSheetDetail?.playlist?.tracks.length === 0
            }"
            @click="jumpToComments"
          >
            <template v-if="songSheetDetail?.playlist?.commentCount > 0">
              <span class="icon">
                ({{ songSheetDetail?.playlist?.commentCount }})
              </span>
            </template>
            <template v-else>
              <span class="icon">评论</span>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, toRefs } from 'vue';
import { useStore } from 'vuex';
import { throttle } from 'lodash';
import { setMessage } from '@/components/message/useMessage';
import useMusicToPlayList from '@/common/useMusicToPlayList';
import usePlaySingleMusic from '@/common/usePlaySingleMusic';
import { formatDateTime } from '@utils/utils';
import type { SongType } from '@/common/audio';

export default defineComponent({
  props: {
    updateFrequency: {
      type: String,
      default: ''
    },
    songSheetDetail: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['changPage'],
  setup(props) {
    const { songSheetDetail } = toRefs(props);

    const $store = useStore();

    const isLogin = computed<boolean>(() => $store.getters.isLogin);

    // 歌曲是否有版权
    function isCopyright(id: number): boolean | undefined {
      const privilege = songSheetDetail.value?.privileges.find(
        (item: { id: number }) => item.id === id
      );
      if (privilege?.cp === 0) {
        return true;
      } else {
        return false;
      }
    }

    // 播放全部 - 默认播放列表第一项
    const playAllMusic = throttle(
      function () {
        if (songSheetDetail.value?.playlist?.tracks.length === 0) {
          return false;
        }

        // 过滤无版权
        const songList: Partial<SongType>[] =
          songSheetDetail.value?.playlist?.tracks.filter(
            (item: { id: number }) => !isCopyright(item.id)
          );

        usePlaySingleMusic(songList[0]);
        useMusicToPlayList({ music: songList, clear: true });
      },
      800,
      {
        leading: true, // 点击第一下是否执行
        trailing: false // 节流时间内，多次点击，节流结束后，是否执行一次
      }
    );

    // 全部音乐添加到播放列表
    function allMusicToPlayList(): boolean | undefined {
      if (songSheetDetail.value?.playlist?.tracks.length === 0) {
        return false;
      }

      // 过滤无版权
      const songList: Partial<SongType>[] =
        songSheetDetail.value?.playlist?.tracks.filter(
          (item: { id: number }) => !isCopyright(item.id)
        );

      useMusicToPlayList({ music: songList });
    }

    // 收藏
    function handleCollection(): boolean | undefined {
      if (!isLogin.value) {
        $store.commit('setLoginDialog', true);
        return false;
      }
    }

    // 分享
    function handleShare(): boolean | undefined {
      if (!isLogin.value) {
        $store.commit('setLoginDialog', true);
        return false;
      }

      setMessage({ type: 'error', title: '该功能暂未开发' });
    }

    // 下载
    function handleDownload(): void {
      setMessage({ type: 'error', title: '该功能暂未开发' });
    }

    // 跳转至评论
    function jumpToComments(): boolean | undefined {
      if (!isLogin.value) {
        $store.commit('setLoginDialog', true);
        return false;
      }

      const commentDom = document.querySelector(
        '.comment-component'
      ) as HTMLElement;

      window.scrollTo(0, Number(commentDom.offsetTop) + 120);
    }

    return {
      formatDateTime,
      isLogin,
      playAllMusic,
      allMusicToPlayList,
      handleCollection,
      handleShare,
      handleDownload,
      jumpToComments
    };
  }
});
</script>

<style lang="less">
@import url('./toplist-info.less');
</style>
