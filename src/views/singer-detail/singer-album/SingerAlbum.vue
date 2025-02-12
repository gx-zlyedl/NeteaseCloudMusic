<template>
  <div class="singer-album">
    <div class="singer-album-container">
      <ul class="new-disc-list">
        <li
          class="new-disc-item"
          v-for="(item, index) in albumList?.hotAlbums"
          :key="index"
        >
          <div class="item-cover">
            <img
              class="item-cover-img"
              :src="`${item?.picUrl}?param=120y120`"
              alt=""
            />
            <i
              class="item-cover-bg"
              :title="item.name"
              @click="jumpAlbumDetail(item?.id)"
            ></i>
            <i
              class="item-cover-play"
              title="播放"
              @click="albumToPlayListPlay(item?.id)"
            ></i>
          </div>
          <p
            class="desc"
            :title="item?.name"
            @click="jumpAlbumDetail(item?.id)"
          >
            {{ item?.name }}
          </p>
          <p class="name">
            {{ formatDateTime(item?.publishTime / 1000, 'yyyy.MM.dd') }}
          </p>
        </li>
      </ul>
      <Page
        v-if="albumParams.total > albumParams.limit"
        :page="albumParams.offset"
        :pageSize="albumParams.limit"
        :total="albumParams.total"
        @changPage="changPage"
      />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch } from 'vue';
import { useStore } from 'vuex';
import useMusicToPlayList from '@/common/useMusicToPlayList';
import usePlaySingleMusic from '@/common/usePlaySingleMusic';
import { formatDateTime } from '@utils/utils';
import { artistAlbum } from '@api/album-detail';
import { albumDetail } from '@api/album-detail';
import type { ResponseType } from '@/types/types';
import type { SongType } from '@/common/audio';
import Page from '@components/page/Page.vue';

type AlbumParams = {
  offset: number;
  limit: number;
  total: number;
};

export default defineComponent({
  components: {
    Page
  },
  setup() {
    const $store = useStore();

    const singerId = computed<number>(() => $store.getters.singerId);

    watch(
      () => singerId.value,
      curVal => {
        if (curVal) {
          getArtistAlbum();
        }
      }
    );

    const albumList = ref();
    const albumParams = reactive<AlbumParams>({
      offset: 1, // 页数
      limit: 12, // 条数
      total: 0 // 总数
    });

    // 获取歌手专辑
    function getArtistAlbum(): void {
      artistAlbum({
        id: singerId.value,
        offset: (albumParams.offset - 1) * albumParams.limit,
        limit: albumParams.limit
      })
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            albumList.value = res;
            albumParams.total = res?.artist?.albumSize;
          }
        })
        .catch(() => ({}));
    }
    getArtistAlbum();

    // 专辑歌曲添加到播放器
    function albumToPlayListPlay(id: number): void {
      albumDetail({ id })
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            if (res?.songs.length === 0) {
              return false;
            }

            // 歌曲是否全部无版权
            const allNoCopyright = res?.songs?.some(
              (item: Record<string, { cp: number }>) => item.privilege?.cp === 1
            );
            if (!allNoCopyright) {
              $store.commit('setCopyright', {
                visible: true,
                message:
                  '版权方要求，当前专辑需单独付费，购买数字专辑即可无限畅享'
              });
              return false;
            }

            // 过滤无版权
            const songList: Partial<SongType>[] = res?.songs.filter(
              (item: Record<string, { cp: number }>) =>
                item?.privilege?.cp !== 0
            );

            usePlaySingleMusic(songList[0]);
            useMusicToPlayList({ music: songList, clear: true });
          }
        })
        .catch(() => ({}));
    }

    // 分页
    function changPage(current: number): void {
      albumParams.offset = current;
      getArtistAlbum();
    }

    // 跳转专辑详情
    function jumpAlbumDetail(id: number): void {
      $store.commit('jumpAlbumDetail', id);
    }

    return {
      formatDateTime,
      albumList,
      albumParams,
      albumToPlayListPlay,
      changPage,
      jumpAlbumDetail
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./singer-album.less');
</style>
