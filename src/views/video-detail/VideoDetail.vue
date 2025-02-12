<template>
  <div class="video-detail">
    <div class="detail-container">
      <div class="detail-content">
        <div class="title">
          <h2 class="title-text" :title="videoDetailData?.title">
            {{ videoDetailData?.title }}
          </h2>
          <div class="title-info">
            <span class="by">by</span>
            <span
              class="name"
              :title="videoDetailData?.creator?.nickname"
              @click="jumpUserProfile(videoDetailData?.creator?.userId)"
            >
              {{ videoDetailData?.creator?.nickname }}
            </span>
          </div>
        </div>
        <div class="video-container">
          <VideoPlayer
            :detail="videoDetailData"
            :subed="videoSubed"
            @handleCollection="handleCollection"
          />
        </div>
        <div class="operate-btn">
          <div class="other like" @click="handleLike">
            <template v-if="videoDetailData?.praisedCount > 0">
              <i class="like-icon"></i>
              <span class="icon"> ({{ videoDetailData?.praisedCount }}) </span>
            </template>
            <template v-else>
              <i class="like-icon"></i>
              <span class="icon">喜欢</span>
            </template>
          </div>
          <div
            class="other collection"
            :class="{ 'collection-sub': videoSubed }"
            @click="handleCollection(videoSubed)"
          >
            <template v-if="videoDetailData?.subscribeCount > 0">
              <span class="icon">
                ({{ videoDetailData?.subscribeCount }})
              </span>
            </template>
            <template v-else>
              <span class="icon">收藏</span>
            </template>
          </div>
          <div class="other share" @click="handleShare">
            <template v-if="videoDetailData?.shareCount > 0">
              <span class="icon">({{ videoDetailData?.shareCount }})</span>
            </template>
            <template v-else>
              <span class="icon">分享</span>
            </template>
          </div>
        </div>
        <div class="comment-component">
          <Comment
            :commentParams="commentParams"
            @commentRefresh="commentRefresh"
          />
        </div>
        <Page
          v-if="commentParams.total > commentParams.limit"
          :page="commentParams.offset"
          :pageSize="commentParams.limit"
          :total="commentParams.total"
          @changPage="changPage"
        />
      </div>
      <div class="detail-side">
        <VideoDetailSide :detail="videoDetailData" />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  reactive,
  computed,
  watch,
  nextTick,
  onMounted
} from 'vue';
import { useStore } from 'vuex';
import { setMessage } from '@/components/message/useMessage';
import { handleCommentData } from '@components/comment/handleCommentData';
import { MyVideoSbulist } from '@api/my-music';
import { videoDetail } from '@api/video-detail';
import { commentVideo } from '@api/comment';
import { videoUrl, videoSub } from '@api/video-detail';
import type { ResponseType } from '@/types/types';
import type { CommentParams } from '@components/comment/Comment.vue';
import type { Video } from '@store/video/state';
import VideoPlayer from '@components/video-player/VideoPlayer.vue';
import Comment from '@components/comment/Comment.vue';
import VideoDetailSide from './video-detail-side/VideoDetailSide.vue';
import Page from '@components/page/Page.vue';

export default defineComponent({
  name: 'VideoDetail',
  components: {
    VideoPlayer,
    Comment,
    VideoDetailSide,
    Page
  },
  setup() {
    const $store = useStore();

    const isLogin = computed<boolean>(() => $store.getters.isLogin);
    const video = computed<Video>(() => $store.getters['video/video']);

    watch(
      () => video.value.id,
      curVal => {
        if (curVal) {
          nextTick(() => {
            getVideoDetail();
            getVideoSrc();
            getVideoSbulist();
            getCommentData();
          });
        }
      },
      {
        immediate: true
      }
    );

    const videoDetailData = ref<unknown>({});

    // 获取视频详情
    function getVideoDetail(): void {
      videoDetail({
        id: video.value.id
      })
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            videoDetailData.value = res?.data;
          }
        })
        .catch(() => ({}));
    }

    // 获取播放地址
    function getVideoSrc(): void {
      videoUrl({ id: video.value.id })
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            $store.commit('video/setVideo', {
              ...video.value,
              url: res?.urls[0]?.url
            });
          }
        })
        .catch(() => ({}));
    }

    // 喜欢
    function handleLike(): boolean | undefined {
      if (!isLogin.value) {
        $store.commit('setLoginDialog', true);
        return false;
      }

      setMessage({ type: 'error', title: '该功能暂未开发' });
    }

    const videoSubed = ref<boolean>(false);

    // 获取收藏的视频列表,判断当前视频是否被收藏
    function getVideoSbulist(): void {
      MyVideoSbulist()
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            res?.data?.forEach((item: { vid: number }) => {
              if (item?.vid === video.value.id) {
                videoSubed.value = true;
              }
            });
          }
        })
        .catch(() => ({}));
    }

    // 收藏
    function handleCollection(followed: boolean): boolean | undefined {
      if (!isLogin.value) {
        $store.commit('setLoginDialog', true);
        return false;
      }

      // 1:收藏 2:取消收藏
      const t = followed ? 2 : 1;

      videoSub({ id: video.value.id, t })
        .then((res: ResponseType) => {
          if (res?.code === 200) {
            if (t === 1) {
              setMessage({ type: 'info', title: '收藏成功' });

              videoSubed.value = true;
            }
            if (t === 2) {
              setMessage({ type: 'info', title: '取消收藏成功' });

              videoSubed.value = false;
            }
          } else {
            setMessage({ type: 'error', title: res?.message });
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

    // 获取评论数据
    const commentParams = reactive<CommentParams>({
      type: 5,
      id: video.value.id,
      offset: 1,
      limit: 20,
      total: 0,
      hotList: [],
      list: []
    });
    function getCommentData(): void {
      const params = {
        id: video.value.id,
        limit: commentParams.limit
      };
      // 精彩评论不加offset
      if (commentParams.offset > 1) {
        params['offset'] = (commentParams.offset - 1) * commentParams.limit;
      }
      commentVideo({ ...params })
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

    // 跳转用户资料
    function jumpUserProfile(id: number): void {
      $store.commit('jumpUserProfile', id);
    }

    onMounted(() => {
      $store.commit('setMenuIndex', 0);
      $store.commit('setSubMenuIndex', -1);
    });

    return {
      videoDetailData,
      handleLike,
      videoSubed,
      handleCollection,
      handleShare,
      commentParams,
      commentRefresh,
      changPage,
      jumpUserProfile
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./video-detail.less');
</style>
