<template>
  <div class="song-list">
    <dl class="group" v-for="(item, index) in list" :key="index">
      <dt class="top">
        <div class="top-img" @click="songListMore(item?.playlist?.id)">
          <img class="img" :src="item?.playlist?.coverImgUrl" alt="" />
        </div>
        <div class="title">
          <h3
            class="t-text"
            :title="item?.playlist?.name"
            @click="songListMore(item?.playlist?.id)"
          >
            {{ item?.playlist?.name }}
          </h3>
          <div class="btns">
            <i class="btn-play" title="播放" @click="playAllMusic(index)"></i>
            <template v-if="!item?.playlist?.subscribed">
              <i
                class="btn-collection"
                title="收藏"
                @click="handleCollectAll(item?.playlist?.id)"
              ></i>
            </template>
            <template v-if="item?.playlist?.subscribed">
              <i class="btn-collection subscribe" title="已收藏"></i>
            </template>
          </div>
        </div>
      </dt>
      <dd>
        <ul class="list">
          <li
            class="item"
            v-for="(i, ind) in item?.playlist?.tracks?.slice(0, 10)"
            :key="ind"
          >
            <span class="num" :class="{ 'top-three': ind < 3 }">
              {{ ind + 1 }}
            </span>
            <p class="text" :title="i?.name" @click="jumpSongDetail(i.id)">
              {{ i?.name }}
            </p>
            <div class="operate">
              <i
                class="operate-play"
                title="播放"
                @click="playSingleMusic(i)"
              ></i>
              <i
                class="operate-add"
                title="添加到播放列表"
                @click="singleMusicToPlayList(i)"
              ></i>
              <i
                class="operate-collection"
                title="收藏"
                @click="handleCollection(i.id)"
              ></i>
            </div>
          </li>
        </ul>
        <div class="more" @click="songListMore(item?.playlist?.id)">
          查看全部>
        </div>
      </dd>
    </dl>
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
import { topList } from '@api/home-toplist';
import { playlistDetail } from '@api/song-sheet-detail';
import { playlistSubscribe } from '@api/song-sheet-detail';
import type { ResponseType } from '@/types/types';
import type { SongType } from '@/common/audio';

export default defineComponent({
  setup() {
    const $router = useRouter();
    const $store = useStore();

    const isLogin = computed<boolean>(() => $store.getters.isLogin);

    const list = ref<Record<string, any>>([]);

    // 获取所有榜单
    function getTopList(): void {
      topList()
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            const toplist = res?.list?.slice(0, 3);

            Promise.allSettled(
              toplist.map((item: { id: number }) => getSongSheetDetail(item.id))
            )
              .then(res => {
                [].forEach.call(
                  res,
                  function (e: { status: string; value: unknown }) {
                    if (e.status === 'fulfilled') {
                      list.value.push(e.value);
                    } else {
                      list.value.push({});
                    }
                  }
                );
              })
              .catch(() => ({}));
          }
        })
        .catch(() => ({}));
    }
    getTopList();

    // 获取歌单详情
    function getSongSheetDetail(id: number): Promise<unknown> {
      return new Promise((resolve, reject) => {
        playlistDetail({ id })
          .then((res: ResponseType) => {
            if (res?.code === 200) {
              resolve(res);
            } else {
              reject();
            }
          })
          .catch(() => reject());
      });
    }

    // 播放全部 - 默认播放列表第一项
    const playAllMusic = throttle(
      function (index: number) {
        if (list.value[index].playlist?.tracks.length === 0) {
          return false;
        }

        // 过滤无版权
        const songList = list.value[index].playlist?.tracks.filter(
          (item: Partial<SongType>) => item
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

    // 收藏
    function handleCollectAll(id: number): boolean | undefined {
      if (!isLogin.value) {
        $store.commit('setLoginDialog', true);
        return false;
      }

      // 1:收藏 2:取消收藏
      playlistSubscribe({ id, t: 1 })
        .then((res: ResponseType) => {
          if (res.code === 200) {
            list.value.forEach(
              (item: Record<string, { id: number; subscribed: boolean }>) => {
                if (item?.playlist?.id === id) {
                  item.playlist.subscribed = true;
                }
              }
            );

            setMessage({ type: 'info', title: '收藏成功' });
          } else {
            setMessage({ type: 'error', title: '收藏失败' });
          }
        })
        .catch(() => ({}));
    }

    // 播放单个歌曲
    function playSingleMusic(item: Partial<SongType>): void {
      usePlaySingleMusic(item);
    }

    // 单个音乐添加到播放列表
    function singleMusicToPlayList(item: Partial<SongType>): void {
      useMusicToPlayList({ music: item });
    }

    // 收藏
    function handleCollection(id: number): boolean | undefined {
      if (!isLogin.value) {
        $store.commit('setLoginDialog', true);
        return false;
      }

      $store.commit('collectPlayMusic', {
        visible: true,
        songIds: id
      });
    }

    // 查看全部
    function songListMore(id: number): void {
      $store.commit('setSongSheetId', id);
      $router.push({ name: 'home-toplist', params: { id } });
    }

    // 跳转歌曲详情
    function jumpSongDetail(id: number): void {
      $store.commit('jumpSongDetail', id);
    }

    return {
      list,
      playAllMusic,
      playSingleMusic,
      handleCollectAll,
      singleMusicToPlayList,
      handleCollection,
      songListMore,
      jumpSongDetail
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./song-list.less');
</style>
