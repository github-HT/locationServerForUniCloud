<template>
	<view>
		<web-view :src="url"></web-view>
	</view>
</template>

<script>
	export default {
		onLoad({url,title}) {
			console.log(url,title);
			this.url = url;
			if(title){
				uni.setNavigationBarTitle({title});
			}
		},
		data() {
			return {
				url:null
			};
		}
	}
</script>

<style lang="scss">

</style>
