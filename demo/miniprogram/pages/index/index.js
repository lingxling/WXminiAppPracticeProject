// pages/index/index.js
// 页面功能：展示距离用户最近的大学

var app = getApp();
var QQMapWX = require("../../libs/qqmap-wx-jssdk.js");
let qqmapsdk = new QQMapWX({
  key: '腾讯地图key'
});


Page({
  /**
   * 页面的初始数据
   */
  data: {
    userAddress: {
      longitude: -1,
      latitude: -1
    },
    UniversityInfo: {
      name: "",
      address: "",
      longitude: -1,
      latitude: -1
    },
    logoUrl: "",
    showArray: ['驾车', '步行'],
    array: ['driving', 'walking'],
    index: 0
  },

  bindPickerChange: function(e) {
    console.log('picker发送选择改变，携带值为', e.detail.value)
    this.setData({
      index: e.detail.value
    })
    this.getDestinationUniversity(this.data.UniversityInfo.latitude, this.data.UniversityInfo.longitude, this.data.array[this.data.index])
  },
  //打开地图，前往离用户最近的门店
  openMap: function() {
    var that = this;
    wx.openLocation({
      latitude: that.data.UniversityInfo.latitude,
      longitude: that.data.UniversityInfo.longitude,
      name: that.data.UniversityInfo.name,
      address: that.data.UniversityInfo.address,
      complete: (res) => {},
      fail: (res) => {},
      scale: 18,
      success: (res) => {},
    })
  },
  getDestinationUniversity: function(latitude, longitude, mode) {
    console.log('getDestinationUniversity() running');
    console.log(latitude, longitude, mode);
    let destinationLocation = {"lat": -1, "lng": -1};
    let that = this;
    let nearest_dis = Number.POSITIVE_INFINITY;

    wx.cloud.callFunction({
      name: "searchUniversity",
    })
    .then (ret => {
      let locationList = ret.result;
      qqmapsdk.calculateDistance({
        mode: mode,
        from: {
          latitude: latitude,
          longitude: longitude
        },
        to: locationList.slice(0, Math.min(100, locationList.length)),
        success: (res) => {
          let result = res.result;
         
          for (let j = 0; j < result.elements.length; j++) {
            if (result.elements[j].distance < nearest_dis) {
              nearest_dis = result.elements[j].distance;
              destinationLocation.lat = result.elements[j].to.lat;
              destinationLocation.lng = result.elements[j].to.lng;
            }
          }
          that.data.UniversityInfo.latitude = destinationLocation.lat;
          that.data.UniversityInfo.longitude = destinationLocation.lng;
          that.getUniversityInfo();
        },
        fail: function (error) {
          console.error(error);
        },
      });
    })
    .catch(console.error)
    console.log('getDestinationUniversity() end');
  },

  getUserAuth: function() {
    console.log('getUserAuth() running')
    // 获取用户位置信息授权
    wx.getSetting({
      success: (res) => {
        if (res.authSetting['scope.userLocation'] != undefined && !res.authSetting['scope.userLocation']){
          wx.showModal({
            title: '是否授权当前位置',
            content: '需要获取您的地理位置，请确认授权，否则无法获取您所需数据',
            success: (result) => {
              if(result.cancel){
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              }
              else if (result.confirm) {
                wx.openSetting({
                  success: (dataAu)=>{
                    if (dataAu.authSetting['scope.userLocation'] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      });
                    }
                    else {  // 用户点了授权，但是小程序没拿到授权
                      wx.showToast({
                        title: '授权失败，请开启位置信息',
                        icon: 'none',
                        duration: 1000
                      });
                    }
                  },
                });
              }
            },
          });
        }
      },
      fail: (res) =>{},
      complete: (res) => {},
    })
    console.log('getUserAuth() end')
  },

  // 获取用户经纬度信息
  getUserLocation: function() {
    console.log('getUserLocation() running');
    let that = this;
    that.getUserAuth();
    wx.getLocation({  
      type: 'gcj02', // wgs84 返回 gps 坐标，gcj02 返回可用于 wx.openLocation 的坐标,
      fail: (res) => {
        console.error("get location failed")
      },
      success: (res) => {
        that.setData({
          "userAddress.latitude": res["latitude"],
          "userAddress.longitude": res["longitude"]
        });
        console.log(res)
        that.getDestinationUniversity(res["latitude"], res["longitude"], that.data.array[that.data.index])
      },
      complete: (res) => {}
    });
    console.log('getUserLocation() end');
  },  

  getUniversityInfo: function() {
    console.log('getUniversityInfo running');
    console.log(this.data.UniversityInfo.latitude, this.data.UniversityInfo.longitude);
    let that = this;
    wx.cloud.callFunction({
      name: "getUniversityInfo",
      data: {
        lat: that.data.UniversityInfo.latitude,
        lng: that.data.UniversityInfo.longitude
      },
    })
    .then (ret => {
      console.log(ret);
      that.setData({
        "UniversityInfo.name": ret.result["name"],
        logoUrl: ret.result["logoUrl"]
      });

      qqmapsdk.reverseGeocoder({
        location: {
          latitude: that.data.UniversityInfo.latitude,
          longitude: that.data.UniversityInfo.longitude
        },
        success: function (res) {
          that.setData({
            "UniversityInfo.address": res.result.address
          })
        },
        fail: function (err) {
          console.log(err);
        },
        complete: function (res) {
        }
      });
    })
    .catch(console.error)   
    console.log('getUniversityInfo end'); 
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    console.log('onLoad() running');
    this.getUserLocation();
    console.log('onLoad() end');
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})