// 开发文档：https://uniapp.dcloud.io/uniCloud/clientdb?id=action
const db = uniCloud.database();
const dbCmd = db.command
const signInTable = db.collection('opendb-sign-in');
const scoresTable = db.collection('uni-id-scores');
module.exports = {
	before: async (state, event) => {
		// console.log({state});
		if(state.type == 'create'){
			let date = new Date(new Date().toLocaleDateString()).getTime()
			let {total} = await signInTable.where({
				user_id:state.auth.uid,
				date,
				isDelete:false
			}).count()
			console.log(total);
			if(total){
			  throw new Error("今天已经签到")
			}
			state.newData.date = date
			state.newData.isDelete = false
		}
	},
	after: async (state, event, error, result) => {
		if (error) {
			throw error
		}
		let date = new Date(new Date().toLocaleDateString()).getTime()
		//查最近7天的签到情况
		let {data:signInData} = await signInTable.where({
			user_id:state.auth.uid,
			date:dbCmd.gte(date-3600*24*6*1000),
			isDelete:false
		}).get()
		
		let allDate = signInData.map(item=>item.date)
		
		//今天是本轮签到的第几天
		const n = ( date - Math.min(...allDate) )/3600/24/1000+1;
		//换成数字--第几天
		let days = signInData.map(item=>{
			return (n*10000 - (date - item.date)/3600/24/1000*10000)/10000  -1
		})
		
		if(state.type == 'create'){
			if(n == 7){ //如果已经满一轮就软删除之前的内容
				let setIsDeleteRes = await signInTable.where({
					user_id:state.auth.uid,
					date:dbCmd.neq(date)
				}).update({isDelete:true})
				console.log({setIsDeleteRes});
			}
			//给加积分
			let addScores = await scoresTable.where({user_id:state.auth.uid}).update({
				user_id:state.auth.uid,
				score:dbCmd.inc(n==7?60:10) //如果是第七天就多加50分，也就是60分
			})
			console.log({addScores});
		}
		
		//查出来有多少积分
		let {data:[{score}]} = await scoresTable.where({user_id:state.auth.uid}).get()
		return {...result,score,signInData,n,days}
	}
}
