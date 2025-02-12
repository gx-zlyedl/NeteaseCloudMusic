<template>
  <div class="album-info-container">
    <div class="cover-warp">
      <template v-if="userInfo?.picUrl">
        <img
          class="cover-img"
          :src="`${userInfo?.picUrl}?param=177y177`"
          alt=""
        />
      </template>
      <template v-else>
        <img class="cover-img" src="" alt="" />
      </template>
      <i class="cover-bg"></i>
    </div>
    <div class="info-right">
      <div class="title">
        <i class="icon-title"></i>
        <h2 class="title-text">
          {{ userInfo?.name }}
        </h2>
      </div>
      <div class="info">
        <span>歌手：</span>
        <template v-for="(item, index) in userInfo?.artists" :key="index">
          <span
            class="name"
            :title="item?.name"
            @click="jumpSingerDetail(item?.id)"
          >
            {{ item?.name }}
          </span>
          <span class="line" v-if="index !== userInfo?.artists.length - 1">
            /
          </span>
        </template>
      </div>
      <div class="info">
        <span>发行时间：</span>
        <span class="text">
          {{ formatDateTime(userInfo?.publishTime / 1000, 'yyyy-MM-dd') }}
        </span>
      </div>
      <div class="info" v-if="userInfo?.company">
        <span>发行公司：</span>
        <span class="text">
          {{ userInfo?.company }}
        </span>
      </div>
      <div class="operate-btn">
        <div class="play" @click="playAllMusic">
          <span class="icon-play" title="播放">播放</span>
        </div>
        <div
          class="play-add"
          title="添加到播放列表"
          @click="allMusicToPlayList"
        ></div>
        <div class="other collection" @click="handleCollectAll">
          <template v-if="userInfo?.info?.likedCount > 0">
            <span class="icon"> ({{ userInfo?.info?.likedCount }}) </span>
          </template>
          <template v-else>
            <span class="icon">收藏</span>
          </template>
        </div>
        <div class="other share" @click="handleShare">
          <template v-if="userInfo?.info?.shareCount > 0">
            <span class="icon">({{ userInfo?.info?.shareCount }})</span>
          </template>
          <template v-else>
            <span class="icon">分享</span>
          </template>
        </div>
        <div class="other download" @click="handleDownload">
          <span class="icon">下载</span>
        </div>
        <div class="other comment" @click="jumpToComments">
          <template v-if="userInfo?.info?.commentCount > 0">
            <span class="icon">({{ userInfo?.info?.commentCount }})</span>
          </template>
          <template v-else>
            <span class="icon">评论</span>
          </template>
        </div>
      </div>
    </div>
    <div class="album-desc" v-if="userInfo?.description">
      <h3 class="album-desc-title">专辑介绍：</h3>
      <div class="album-desc-text" v-if="userInfo?.description?.length < 170">
        <pre class="text">{{ userInfo?.description }}</pre>
      </div>
      <div class="album-desc-text" v-else :class="{ 'text-hide': !toggleShow }">
        <pre class="text">{{ userInfo?.description }}</pre>
      </div>
    </div>
    <div class="toggle-btn" v-if="userInfo?.description?.length > 170">
      <span v-if="!toggleShow" @click="toggle">
        <span class="text">展开</span>
        <i class="icon"></i>
      </span>
      <span v-else @click="toggle">
        <span class="text">收起</span>
        <i class="icon hide"></i>
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, toRefs } from 'vue';
import { useStore } from 'vuex';
import { throttle } from 'lodash';
import { setMessage } from '@/components/message/useMessage';
import useMusicToPlayList from '@/common/useMusicToPlayList';
import usePlaySingleMusic from '@/common/usePlaySingleMusic';
import { formatDateTime } from '@utils/utils';
import type { SongType } from '@/common/audio';

export default defineComponent({
  props: {
    userInfo: {
      type: Object,
      default: () => ({})
    },
    songs: {
      type: Object,
      default: () => ({})
    }
  },
  emits: ['jumpToComments'],
  setup(props, { emit }) {
    const { songs } = toRefs(props);

    const $store = useStore();

    const isLogin = computed<boolean>(() => $store.getters.isLogin);

    // 简介展开/收缩
    const toggleShow = ref<boolean>(false);
    function toggle(): void {
      toggleShow.value = !toggleShow.value;
    }

    // 播放全部 - 默认播放列表第一项
    const playAllMusic = throttle(
      function () {
        if (songs.value.length === 0) {
          return false;
        }

        // 歌曲是否全部无版权
        const allNoCopyright = props?.songs?.some(
          (item: Record<string, { cp: number }>) => item.privilege?.cp === 1
        );
        if (!allNoCopyright) {
          $store.commit('setCopyright', {
            visible: true,
            message: '由于版权保护，您所在的地区暂时无法使用。'
          });
          return false;
        }

        // 过滤无版权
        const songList: Partial<SongType>[] = songs.value.filter(
          (item: Record<string, { cp: number }>) => item?.privilege?.cp !== 0
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
      if (songs.value.length === 0) {
        return false;
      }

      // 歌曲是否全部无版权
      const allNoCopyright = props?.songs?.some(
        (item: Record<string, { cp: number }>) => item.privilege?.cp === 1
      );
      if (!allNoCopyright) {
        $store.commit('setCopyright', {
          visible: true,
          message: '由于版权保护，您所在的地区暂时无法使用。'
        });
        return false;
      }

      // 过滤无版权
      const songList: Partial<SongType>[] = songs.value.filter(
        (item: Record<string, { cp: number }>) => item?.privilege?.cp !== 0
      );

      useMusicToPlayList({ music: songList });
    }

    // 收藏全部
    function handleCollectAll(): boolean | undefined {
      if (!isLogin.value) {
        $store.commit('setLoginDialog', true);
        return false;
      }

      // 歌曲是否全部无版权
      const allNoCopyright = props?.songs?.some(
        (item: Record<string, { cp: number }>) => item.privilege?.cp === 1
      );
      if (!allNoCopyright) {
        $store.commit('setCopyright', {
          visible: true,
          message: '由于版权保护，您所在的地区暂时无法使用。'
        });
        return false;
      }

      let ids = '';
      songs.value.forEach((item: Record<string, { cp: number }>) => {
        // 无版权过滤
        if (item?.privilege?.cp === 0) {
          return false;
        }

        ids += `${item.id},`;
      });

      $store.commit('collectPlayMusic', {
        visible: true,
        songIds: ids
      });
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

      emit('jumpToComments');
    }

    // 跳转歌手详情
    function jumpSingerDetail(id: number): void {
      $store.commit('jumpSingerDetail', id);
    }

    return {
      formatDateTime,
      toggleShow,
      toggle,
      playAllMusic,
      allMusicToPlayList,
      handleCollectAll,
      handleShare,
      handleDownload,
      jumpToComments,
      jumpSingerDetail
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./album-info.less');
</style>
