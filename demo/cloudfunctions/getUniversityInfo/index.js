// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
    env: "demo-o9g5e"
});
const db = cloud.database();
// 云函数入口函数
exports.main = async (event, context) => {
    let tmp = await db.collection('UniversityInfo')
    .where({
      latitude: event.lat,
      longitude: event.lng
    })
    .field({
        name: true
    })
    .get();
    let ret = {name: tmp.data[0].name, logoUrl: "cloud://demo-o9g5e.6465-demo-o9g5e-1302309095/university/" + tmp.data[0].name + ".jpg"};
    return ret;
}