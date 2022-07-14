<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<script>
import VConsole from 'vconsole'
export default {
    name: 'App',
    mounted(){
        // 添加手机端调试工具
    // eslint-disable-next-line no-unused-vars
    const vconsole = new VConsole()
    }
};
</script>

<style>
#app {
    width: 100%;
    height: 100%;
    position: absolute;
    overflow-y: hidden;
    -webkit-tap-highlight-color: transparent;
    -webkit-font-smoothing: antialiased;
}
</style>
