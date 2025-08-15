<template>

</template>
<script>
export default {
  name: 'LoginButtonWlk',
  data(){
    return {
      wow_path : {}
    }

  },
  created() {
    //获取版本号
    this.get_version()
  },
  methods:{

  }
}
</script>
<style>
.login_button_form{
  padding: 3vh;
}
</style>
