<template>
  <ul class="user-nav-list">
    <li
      class="item"
      v-for="(item, index) in list"
      :key="index"
      @click="jumpDetail(item)"
    >
      <i :class="`icon ${item?.icon}`"></i>
      <span class="title" v-if="item?.link">{{ item?.title }}</span>
      <a class="link" target="_blank" v-else :href="item?.href">
        {{ item?.title }}
        <span class="msg-tag" v-show="item.icon === 'message' && msgCode !== 0">
          {{ msgCode }}
        </span>
      </a>
    </li>
  </ul>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { setMessage } from '@/components/message/useMessage';

type List = {
  title: string;
  link?: string;
  href?: string;
  icon: string;
};

export default defineComponent({
  name: 'UserView',
  props: {
    msgCode: {
      type: Number,
      default: 0
    }
  },
  setup() {
    const $router = useRouter();
    const $store = useStore();

    const userInfo = computed(() => $store.getters.userInfo);

    const list = ref<List[]>([
      {
        title: '我的主页',
        link: '/user-profile',
        icon: 'homepage'
      },
      {
        title: '我的消息',
        link: '',
        icon: 'message'
      },
      {
        title: '我的等级',
        link: '/level',
        icon: 'grade'
      },
      {
        title: 'VIP会员',
        link: '/member',
        icon: 'member'
      },
      {
        title: '个人设置',
        link: '',
        icon: 'setting'
      },
      {
        title: '实名认证',
        href: 'https://music.163.com/st/userbasic/?module=st%2Fuserbasic%2F#/nameverify',
        icon: 'real-name'
      },
      {
        title: '退出',
        link: '/logout',
        icon: 'logout'
      }
    ]);

    function jumpDetail(item: List): boolean | undefined {
      if (!item?.link && item?.href) {
        return false;
      }

      if (!item?.link) {
        setMessage({ type: 'error', title: '该功能暂未开发' });
        return false;
      }

      if (item?.link === '/logout') {
        $store.dispatch('setLogout');
        return false;
      }

      // 一级导航取消选中
      $store.commit('setMenuIndex', -1);

      if (item?.link === '/user-profile') {
        $store.commit('jumpUserProfile', userInfo.value?.profile?.userId);
        return false;
      }

      $router.push({ path: item?.link || '/' });
    }

    return {
      list,
      jumpDetail
    };
  }
});
</script>

<style lang="less" scoped>
@import url('./user.less');
</style>
