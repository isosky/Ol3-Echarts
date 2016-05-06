
var map;
var drawLayer;
var format = 'image/png';
var bounds = [13180801.4222456, 3663612.77697468,
    13272244.5176114, 3844254.1268673];
function init() {
    var mapcenter=[(bounds[0]+bounds[2])/ 2,(bounds[1]+bounds[3])/ 2];
    var untiled = new ol.layer.Image({
        source: new ol.source.ImageWMS({
            ratio: 1,
            url: 'http://localhost:8090/geoserver/network/wms',
            params: {'FORMAT': format,
                'VERSION': '1.1.1',
                LAYERS: 'network:road',
                STYLES: '',
            }
        })
    });
    var bb = new ol.layer.Image({
        source: new ol.source.ImageWMS({
            ratio: 1,
            url: 'http://localhost:8090/geoserver/network/wms',
            params: {'FORMAT': format,
                'VERSION': '1.1.1',
                LAYERS: 'network:bb',
                STYLES: '',
            }
        })
    });
    drawLayer = new ol.layer.Vector({
        source:new ol.source.Vector()
    });
    map = new ol.Map({
        controls: [],
        layers: [untiled,drawLayer],
        target: 'map',
        view: new ol.View({
            center: mapcenter,
            zoom: 10
        })
    });

    //overlay加个小点，等同于ol2的marker
    var markerEl = document.getElementById('geolocation_marker');
    var marker = new ol.Overlay({
        positioning: 'center-center',
        element: markerEl,
        stopEvent: false
    });
    map.addOverlay(marker);
}
function stringReg(str) {
    var reg = new RegExp(",", "g"); // 创建正则RegExp对象
    str = str.replace(reg, "\\,");
    /*
    var reg = new RegExp("{", "g")
    str = str.replace(reg, "\'{");
    var reg = new RegExp("}", "g")
    str = str.replace(reg, "}\'");*/
    return str;
}
//历史测试数据，时间是字符串，暂时随便写一个。
var gps_points=[
    {lon:13222397.09560,lat:3771644.61574,time:'r'},
    {lon:13222451.97321,lat:3771556.33436,time:'r'},
    {lon:13222540.25459,lat:3771513.38666,time:'r'},
    {lon:13222604.67613,lat:3771398.85947,time:'r'},
    {lon:13222745.44914,lat:3771253.31450,time:'r'},
    {lon:13222871.90625,lat:3771196.0509,time:'r'},
    {lon:13222922.01189,lat:3771079.13733,time:'r'},
    {lon:13222941.09976,lat:3771033.80405,time:'r'},
    {lon:13222974.50352,lat:3770964.61054,time:'r'},
    {lon:13223036.53908,lat:3770983.6984,time:'r'},
    {lon:13223139.13636,lat:3770966.99652,time:'r'},
    {lon: 13223248.89158,lat:3770952.68062,time:'r'}
];
function btnhistory()
{
    mapMatching_history(gps_points);
}
var index=0;
var gpstask;
function btnrealtime()
{
    //模拟定时读取连续gps点
    gpstask=setInterval(getgpsPoint,3000);
}
function getgpsPoint()
{
    if(index>=gps_points.length)
        clearInterval(gpstask);//超过模拟的gps点取消定时器
    var gpx=gps_points[i];
    mapMatching_realtime(gpx);//以上都是代码模拟，而当前这个方法是正式方法。接收实时获取的gps点
}



//历史轨迹点匹配方法
function mapMatching_history(arr)
{
    var GPS_Points=[];
    for(var i= 0,count=arr.length;i<count;i++)
    {
        var item='\'('+arr[i].lon+','+arr[i].lat+',\'\''+arr[i].time+'\'\')\'';
        GPS_Points.push(item);
    }//将测试gps历史点集合，拼成要查询的字符串
    GPS_Points='array['+GPS_Points.join(',')+']::gpx[]';//拼成字符串
    var viewparamas='GPS_Points:'+stringReg(GPS_Points);
    getFeature({
        typename:'network:Map_Matching',
        srid:'EPSG:3857',
        viewparams:viewparamas,
        callback:'loadhistoryresult'

    });//提交服务器查询

}
//实时轨迹点匹配方法
function mapMatching_realtime(gpx){
    var gps='\'('+gpx.lon+','+gpx.lat+',\'\''+gpx.time+'\'\')\'::gpx';
    getFeature({
        typename:'network:Map_Matching_realtime',
        srid:'EPSG:3857',
        viewparams:viewparamas,
        callback:'loadrealtimeresult'

    });//提交服务器查询

}



/*
function insert()
{
    //以下只是模拟与数据库插入通信
    var geomstr='Point(13222451.97321 3771556.33436)';//实际中是程序新增feature后，将feature的geom转wkt字符串，详细参考  format.wkt
    var field1={"fieldname":"swglm","fieldtype":"number","fieldvalue":34262399880};
    var field2={"fieldname":"geom","fieldtype":"geometry","fieldvalue":geomstr};//模拟了一个业务字段，一个图形字段
    var arr=[];
    arr.push(field1,field2);
    var p_values=JSON.stringify(arr);//将参数对象转json字符串
    p_values=stringReg(p_values);//对特殊字符加转义符号
    var viewparamas= ['p_values:array' + p_values + '::jsonb[]',
        'p_layername:\'' +'jgnsr'+'\'',
        'p_srid:' + 3857]; //字符型参数要加 \'转义，数字型不用
    viewparamas=viewparamas.join(';');
   getFeature({
        typename:'network:GIS_insert',
        srid:'EPSG:3857',
        viewparams:viewparamas,
        callback:'loadresult'

    });

}*/
var geojsonFormat=new ol.format.GeoJSON({defaultDataProjection:"EPSG:3857"});
//历史查询结果
function loadhistoryresult(res){
   //console.log(res);
    var features=geojsonFormat.readFeatures(res);
    drawLayer.getSource().addFeatures(features);
}
//实时查询结果
function loadrealtimeresult(res)
{

}






function getFeature(options)
{
    $.ajax('http://localhost:8090/geoserver/wfs',{
        type: 'GET',
        data: {
            service: 'WFS',
            version: '1.1.0',
            request: 'GetFeature',
            typename: options.typename,
            srsname: options.srid,
            outputFormat: 'text/javascript',
            viewparams:options.viewparams,
            bbox:(options.extent===undefined)?undefined:options.extent.join(',') +  ','+options.srid,//与filter只能用一个
            filter:options.filter
        },
        dataType: 'jsonp',
        jsonpCallback:'callback:'+options.callback,
        jsonp:'format_options'
    });

}
