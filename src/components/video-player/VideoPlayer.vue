<template>
  <div class="video-player" :class="{ 'video-player-fullscreen': fullscreen }">
    <VideoView :videoStatus="videoStatus" @videoEnded="videoEnded" />
    <div class="play" @click="togglePlayStatus">
      <i class="icon pause-icon" v-if="videoStatus === 'pause'"></i>
      <i class="icon replay-icon" v-if="videoStatus === 'ended'">
        <span class="text">重播</span>
      </i>
    </div>
    <!-- 大屏显示 -->
    <div class="full-operate">
      <h2 class="title">
        {{ detail.title }} - by
        {{ detail?.creator?.nickname }}
      </h2>
      <ul class="list">
        <li class="item" @click="handleLike">
          <i class="icon like"></i>
        </li>
        <li class="item" @click="handleCollection(subed)">
          <i class="icon collection" :class="{ collectioned: subed }"></i>
        </li>
        <li class="item" @click="handleShare">
          <i class="icon share"></i>
        </li>
      </ul>
    </div>
    <div class="wrap">
      <i
        class="icon play-btn"
        v-if="videoStatus === 'play'"
        @click="togglePlayStatus"
      ></i>
      <i class="icon pause-btn" v-else @click="togglePlayStatus"></i>
      <span class="time">
        {{ timeStampToDuration(videoPlayProgress.currentTime || 0) || '00:00' }}
      </span>
      <div class="progress">
        <PlayProgress />
      </div>
      <span class="time">
        {{ timeStampToDuration(videoPlayProgress.duration || 0) || '00:00' }}
      </span>
      <div class="other">
        <i
          class="volume-btn"
          :class="{ 'no-volume': Number(videoVolume) === 0 }"
          @click="setVolumeProgress"
        ></i>
        <div class="video-volume-progress">
          <volume-progress v-if="volumeProgressShow" />
        </div>
        <p class="mode">高清</p>
        <i class="full" v-if="!fullscreen" @click="lanchFullscreen"></i>
        <i class="narrow" v-else @click="exitFullscreen"></i>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  ref,
  computed,
  watch,
  onMounted,
  onUnmounted
} from 'vue';
import { useStore } from 'vuex';
import { timeStampToDuration } from '@utils/utils';
import { setMessage } from '@/components/message/useMessage';
import VideoView from './video/Video.vue';
import PlayProgress from './play-progress/PlayProgress.vue';
import VolumeProgress from './volume-progress/VolumeProgress.vue';

export default defineComponent({
  components: {
    VideoView,
    PlayProgress,
    VolumeProgress
  },
  props: {
    detail: {
      type: Object,
      default: () => ({})
    },
    subed: {
      type: Boolean,
      default: false
    }
  },
  emits: ['handleCollection'],
  setup(props, { emit }) {
    const $store = useStore();

    const videoVolume = computed(() => $store.getters['video/videoVolume']);
    // 播放进度数据
    const videoPlayProgress = computed(
      () => $store.getters['video/videoPlayProgress']
    );
    // 播放状态
    const musicPlayStatus = computed(
      () => $store.getters['music/musicPlayStatus']
    );

    const videoStatus = ref<string>('pause');

    // 播放视频暂停音乐,播放音乐暂停视频
    watch(
      () => videoStatus.value,
      () => {
        if (videoStatus.value === 'play') {
          $store.commit('music/setMusicPlayStatus', {
            look: false,
            loading: false,
            refresh: false
          });
        }
      }
    );
    watch(
      () => musicPlayStatus.value,
      () => {
        if (musicPlayStatus.value.look) {
          videoStatus.value = 'pause';
        }
      }
    );

    // 切换播放/暂停状态
    function togglePlayStatus(): void {
      videoStatus.value = videoStatus.value === 'play' ? 'pause' : 'play';
    }

    // 播放完成
    function videoEnded(): void {
      videoStatus.value = 'ended';

      setTimeout(() => {
        videoReplay();
      }, 10);
    }

    // 重播
    function videoReplay(): void {
      videoStatus.value = 'replay';
    }

    // 全屏切换
    const fullscreen = ref<boolean>(false);

    // 进入全屏
    function lanchFullscreen() {
      fullscreen.value = true;

      const element = document.documentElement;
      element.requestFullscreen && element.requestFullscreen();
    }

    // 退出全屏
    function exitFullscreen() {
      fullscreen.value = false;

      document.exitFullscreen && document.exitFullscreen();
    }

    // 音量条显隐
    const volumeProgressShow = ref<boolean>(false);
    function setVolumeProgress(): void {
      volumeProgressShow.value = !volumeProgressShow.value;
    }

    // 喜欢
    function handleLike(): void {
      setMessage({ type: 'error', title: '该功能暂未开发' });
    }

    // 收藏
    function handleCollection(followed: boolean): void {
      emit('handleCollection', followed);
    }

    // 分享
    function handleShare(): void {
      setMessage({ type: 'error', title: '该功能暂未开发' });
    }

    onMounted(() => {
      window.addEventListener('keydown', (e: KeyboardEvent) => {
        const key = e.key;
        if (key === 'F11') {
          // 阻止默认的键盘事件
          e.preventDefault();
        }
      });

      window.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
          // 进入大屏
        } else {
          // 退出大屏
          fullscreen.value = false;
        }
      });
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', () => ({}));
      window.removeEventListener('fullscreenchange', () => ({}));
    });

    return {
      timeStampToDuration,
      videoVolume,
      videoPlayProgress,
      videoStatus,
      togglePlayStatus,
      videoEnded,
      videoReplay,
      fullscreen,
      lanchFullscreen,
      exitFullscreen,
      volumeProgressShow,
      setVolumeProgress,
      handleLike,
      handleCollection,
      handleShare
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./video-player.less');
</style>
