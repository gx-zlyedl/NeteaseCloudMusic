<template>
  <div class="home-toplist">
    <div class="home-toplist-container">
      <div class="home-toplist-menu">
        <ToplistMenu
          :character="toplist.character"
          :media="toplist.media"
          @menuChange="menuChange"
        />
      </div>
      <div class="home-toplist-content">
        <ToplistContent
          :updateFrequency="updateFrequency"
          :songSheetDetail="songSheetDetail"
          :commentParams="commentParams"
          @commentRefresh="commentRefresh"
          @changPage="changPage"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, computed, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import { setMessage } from '@/components/message/useMessage';
import { handleCommentData } from '@components/comment/handleCommentData';
import { playlistDetail } from '@api/song-sheet-detail';
import { commentPlayList } from '@api/comment';
import { topList } from '@api/home-toplist';
import type { ResponseType } from '@/types/types';
import type { CommentParams } from '@components/comment/Comment.vue';
import ToplistMenu from './toplist-menu/ToplistMenu.vue';
import ToplistContent from './toplist-content/ToplistContent.vue';

type List = {
  id: number;
  updateFrequency: string;
};

export default defineComponent({
  name: 'home-toplist',
  components: {
    ToplistMenu,
    ToplistContent
  },
  setup() {
    const $route = useRoute();
    const $store = useStore();

    const songSheetId = computed<number>(() => $store.getters.songSheetId);

    // 更新字符串
    const updateFrequency = ref<string>('');

    // 监听路由传参，获取歌单详情
    watch(
      () => $route,
      curVal => {
        if (curVal.path !== '/home-toplist') {
          return false;
        }

        if (curVal.params?.id) {
          (async () => {
            const list: List[] = await getTopList();
            const ItemId = list.findIndex(
              (item: List) => item.id === songSheetId.value
            );
            list.forEach((item: List) => {
              if (ItemId !== -1) {
                if (item.id === songSheetId.value) {
                  updateFrequency.value = item.updateFrequency;
                }
              } else {
                $store.commit('setSongSheetId', list[0].id);
                updateFrequency.value = list[0].updateFrequency;
              }
            });
            getSongSheetDetail();
            getCommentData();
          })();
        } else {
          (async () => {
            const list: List[] = await getTopList();
            $store.commit('setSongSheetId', list[0].id);
            updateFrequency.value = list[0].updateFrequency;
            getSongSheetDetail();
            getCommentData();
          })();
        }
      },
      {
        immediate: true
      }
    );

    const toplist = reactive({
      character: [],
      media: []
    });

    // 获取所有榜单
    function getTopList(): Promise<List[]> {
      return new Promise(resolve => {
        topList()
          .then((res: ResponseType) => {
            if (res?.code === 200) {
              toplist.character = res.list.slice(0, 4);
              toplist.media = res.list.slice(4);
              resolve(res.list);
            } else {
              setMessage({ type: 'error', title: res?.msg });
            }
          })
          .catch(() => ({}));
      });
    }

    // 菜单选择
    function menuChange(id: number, frequency: string): void {
      $store.commit('setSongSheetId', id);
      updateFrequency.value = frequency;
      getSongSheetDetail();
      getCommentData();
    }

    const songSheetDetail = ref<unknown>({});

    // 获取歌单详情
    function getSongSheetDetail(): void {
      playlistDetail({
        id: songSheetId.value
      })
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            songSheetDetail.value = res;
          }
        })
        .catch(() => ({}));
    }

    // 获取评论数据
    const commentParams = reactive<CommentParams>({
      type: 2,
      id: 0,
      offset: 1,
      limit: 20,
      total: 0,
      hotList: [],
      list: []
    });

    watch(
      () => songSheetId.value,
      () => {
        commentParams.id = songSheetId.value;
      }
    );

    function getCommentData(): void {
      const params = {
        id: songSheetId.value,
        limit: commentParams.limit
      };
      // 精彩评论不加offset
      if (commentParams.offset > 1) {
        params['offset'] = (commentParams.offset - 1) * commentParams.limit;
      }
      commentPlayList({ ...params })
        .then((res: ResponseType) => {
          if (res.code === 200) {
            const result = handleCommentData(res);
            // 精彩评论
            commentParams.hotList = result.hotList;
            // 最新评论
            commentParams.list = result.list;
            // 最新评论 - 总数
            commentParams.total = res.total;
          }
        })
        .catch(() => ({}));
    }

    // 刷新评论
    function commentRefresh(): void {
      getCommentData();
    }

    // 分页
    function changPage(current: number): void {
      commentParams.offset = current;
      getCommentData();
    }

    return {
      toplist,
      updateFrequency,
      menuChange,
      songSheetDetail,
      commentParams,
      commentRefresh,
      changPage
    };
  }
});
</script>

<style lang="less">
@import url('./home-toplist.less');
</style>
