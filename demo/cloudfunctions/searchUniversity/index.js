// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: "demo-o9g5e"
});

const db = cloud.database();
const FIELD_COUNT = 100;  // 腾讯地图API限制了查询速度，搞太多数据也没用。
/* TO DO: 将数据库中的地址按照省-市分类，避免将所有地址都传给用户，浪费带宽 */

// 单次查询函数
async function getListIndexUserId(skip) {
  let infoList = await db.collection('UniversityInfo')
  .field({
    latitude: true,
    longitude: true
  })
  .skip(skip)
  .get();
  return infoList.data;
}

// 云函数入口函数
exports.main = async (event, context) => {
  let locationList = [];

  for (let i = 0; i < FIELD_COUNT; i += 100) {
    let initList = await getListIndexUserId(i);
    for (let j = 0; j < initList.length; ++j) {
      locationList.push({latitude: initList[j].latitude, longitude: initList[j].longitude});
    }
  }
  return locationList;
}