<template>
  <div class="home">
    <banner />
    <div class="home-container">
      <div class="container-content">
        <home-content />
      </div>
      <div class="container-side">
        <home-side />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineAsyncComponent, defineComponent } from 'vue';
import Banner from './banner/Banner.vue';
const HomeContent = defineAsyncComponent(() => import('./content/Content.vue'));
const HomeSide = defineAsyncComponent(() => import('./side/Side.vue'));

export default defineComponent({
  name: 'HomeView',
  components: {
    Banner,
    HomeContent,
    HomeSide
  }
});
</script>

<style lang="less" scoped>
.home {
  background-color: #f5f5f5;

  .home-container {
    position: relative;
    width: 980px;
    min-height: 700px;
    margin: 0 auto;
    background: url('~@/assets/image/home/wrap1.png') repeat-y 100% 100%;
    background-color: #fff;
    border: 1px solid #d3d3d3;
    border-width: 0 1px;

    .container-content {
      display: inline-block;
      width: calc(980px - 250px);
      vertical-align: top;
    }

    .container-side {
      display: inline-block;
      width: 250px;
      vertical-align: top;
    }
  }
}
</style>
