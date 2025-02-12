<template>
  <div class="song-sheet-user-info">
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
          <i class="icon-title"></i>
          <h2 class="title-text">
            <p class="text">{{ songSheetDetail?.playlist?.name }}</p>
          </h2>
        </div>
        <div class="info">
          <img
            class="user-avatar"
            :src="songSheetDetail?.playlist?.creator?.avatarUrl"
            @click="jumpUserProfile(songSheetDetail?.playlist?.creator?.userId)"
            alt=""
          />
          <span
            class="user-name"
            @click="jumpUserProfile(songSheetDetail?.playlist?.creator?.userId)"
          >
            {{ songSheetDetail?.playlist?.creator?.nickname }}
          </span>
          <span class="user-time">
            {{
              formatDateTime(
                songSheetDetail?.playlist?.createTime / 1000,
                'yyyy-MM-dd'
              )
            }}
            创建
          </span>
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
          <!-- 自己的歌单，不可收藏/取消收藏 -->
          <template
            v-if="
              songSheetDetail?.playlist?.userId === userInfo?.profile?.userId
            "
          >
            <div class="other collection disable-collection">
              <span
                class="icon"
                v-if="songSheetDetail?.playlist?.subscribedCount > 0"
              >
                ({{ songSheetDetail?.playlist?.subscribedCount }})
              </span>
              <span class="icon" v-else>收藏</span>
            </div>
          </template>
          <!-- 其他人歌单，可收藏/取消收藏 -->
          <template v-else>
            <div
              class="other collection"
              :class="{
                'disable-collection': songSheetDetail?.playlist?.subscribed
              }"
              @click="handleCollection()"
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
          </template>
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
        <div class="tags" v-if="songSheetDetail?.playlist?.tags.length > 0">
          <b class="title">标签：</b>
          <ul class="list">
            <li
              class="item"
              v-for="(item, index) in songSheetDetail?.playlist?.tags"
              :key="index"
              @click="jumpSongSheet(item)"
            >
              <span class="text">{{ item }}</span>
            </li>
          </ul>
        </div>
        <div class="desc" v-if="songSheetDetail?.playlist?.description">
          <div
            class="content"
            v-if="songSheetDetail?.playlist?.description?.length < 170"
          >
            <pre>介绍：{{ songSheetDetail?.playlist?.description }}</pre>
          </div>
          <div class="content" v-else :class="{ 'text-hide': !toggleShow }">
            <pre>介绍：{{ songSheetDetail?.playlist?.description }}</pre>
          </div>
        </div>
        <div
          class="toggle-btn"
          v-if="songSheetDetail?.playlist?.description?.length > 170"
        >
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
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { throttle } from 'lodash';
import { setMessage } from '@/components/message/useMessage';
import useMusicToPlayList from '@/common/useMusicToPlayList';
import usePlaySingleMusic from '@/common/usePlaySingleMusic';
import { formatDateTime } from '@utils/utils';
import { playlistSubscribe } from '@api/song-sheet-detail';
import type { ResponseType } from '@/types/types';
import type { SongType } from '@/common/audio';

export default defineComponent({
  emit: ['jumpToComments'],
  setup(props, { emit }) {
    const $router = useRouter();
    const $store = useStore();

    const isLogin = computed<boolean>(() => $store.getters.isLogin);
    const userInfo = computed(() => $store.getters.userInfo);
    const playMusicId = computed(() => $store.getters['music/playMusicId']);
    // 歌单详情数据
    const songSheetDetail = computed(() => $store.getters.songSheetDetail);

    // 简介展开/收缩
    const toggleShow = ref<boolean>(false);
    function toggle(): void {
      toggleShow.value = !toggleShow.value;
    }

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

      // 歌单是否已收藏
      if (songSheetDetail.value?.playlist?.subscribed) {
        return false;
      }

      // 1:收藏 2:取消收藏
      playlistSubscribe({
        id: songSheetDetail.value?.playlist?.id,
        t: 1
      })
        .then((res: ResponseType) => {
          if (res.code === 200) {
            setMessage({ type: 'info', title: '收藏成功' });

            songSheetDetail.value.playlist.subscribed = true;

            // 更新歌单详情
            $store.commit('setSongSheetDetail', songSheetDetail.value);
          } else {
            setMessage({ type: 'error', title: '收藏失败' });
          }
        })
        .catch(() => ({}));
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

    // 跳转用户资料
    function jumpUserProfile(id: number): void {
      $store.commit('jumpUserProfile', id);
    }

    // 跳转歌单
    function jumpSongSheet(name: string): void {
      $router.push({ name: 'home-song-sheet', params: { name } });
    }

    return {
      formatDateTime,
      userInfo,
      playMusicId,
      songSheetDetail,
      description: songSheetDetail?.value.playlist?.description,
      toggleShow,
      toggle,
      isCopyright,
      playAllMusic,
      allMusicToPlayList,
      handleCollection,
      handleShare,
      handleDownload,
      jumpToComments,
      jumpUserProfile,
      jumpSongSheet
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./user-info.less');
</style>
