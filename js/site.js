function hxlProxyToJSON(input){
    var output = [];
    var keys=[]
    input.forEach(function(e,i){
        if(i==0){
            keys = e;
        } else {
            var row = {};
            e.forEach(function(e2,i2){
                row[keys[i2]] = e2;
            });
            output.push(row);
        }
    });
    return output;
}

function generateDashboard(data){
    console.log(data);
    var cf = crossfilter(data);

    var timeDimension = cf.dimension(function(d){return d['#date+year+quarter'];});
    var methodDimension = cf.dimension(function(d){return d['#x_route+landorsea']});
    var countryDimension = cf.dimension(function(d){return d['#affected+countryorigin']});
    var routeDimension = cf.dimension(function(d){return d['#x_route']});

    var timeGroup = timeDimension.group().reduceSum(function(d){return d['#x_value']});
    var methodGroup = methodDimension.group().reduceSum(function(d){return d['#x_value']});
    var countryGroup = countryDimension.group().reduceSum(function(d){return d['#x_value']});
    var routeGroup = routeDimension.group().reduceSum(function(d){return d['#x_value']});

    var quarters = ['2009 Q1','2009 Q2','2009 Q3','2009 Q4','2010 Q1','2010 Q2','2010 Q3','2010 Q4','2011 Q1','2011 Q2','2011 Q3','2011 Q4','2012 Q1','2012 Q2','2012 Q3','2012 Q4','2013 Q1','2013 Q2','2013 Q3','2013 Q4','2014 Q1','2014 Q2','2014 Q3','2014 Q4','2015 Q1'];

    var timeChart = dc.barChart('#time').height(150).width($('#time').width())
        .dimension(timeDimension)
        .group(timeGroup)
        .x(d3.scale.ordinal().domain(quarters))
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .yAxis().ticks(3);

    var methodChart = dc.pieChart('#entrytype').height(150).width($('#entrytype').width())
        .dimension(methodDimension)
        .group(methodGroup);

    var countryChart = dc.rowChart('#country').height(550).width($('#country').width())
        .dimension(countryDimension)
        .group(countryGroup)
        .data(function(group){
                return group.top(20);
        })
        .elasticX(true)
        .xAxis().ticks(3);

    var mapChart = dc.leafletChoroplethChart('#map')
        .width($('#map').width())
        .height(400)
        .dimension(routeDimension)
        .group(routeGroup)
        .center([0,0])
        .zoom(0)    
        .geojson(routes_geom)
        .featureKeyAccessor(function(feature){
            return feature.properties['Route_name'];
        })
        .colors(colors)
        .colorDomain([0, 4])
        .colorAccessor(function (d) {
            var c=0;
            if(d>5000){
                c=4;
            } else if (d>1000) {
                c=3;
            } else if (d>500) {
                c=2;
            } else if (d>100) {
                c=1;
            } else {
                c=0
            } 
            return c;
            });   
        /*.featureKeyAccessor(function(feature){
            return feature.properties[];
        });/*.popup(function(feature){
            return 'Click to filter <br />'+feature.properties.name;
        })
        .renderPopup(true);        */    

    dc.renderAll();

    map = mapChart.map();
    map.scrollWheelZoom.disable();
    zoomToGeom(routes_geom);

    function zoomToGeom(geom){
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
    }        

}

var colors = ['#ccc','#ffffb2','#fecc5c','#fd8d3c','#e31a1c'];

var dataurl = 'http://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/10F5vls-WgM6tj9RgK3TKOjYEtXDAapcxDFfh1tuXkzc/pub%3Fgid%3D0%26single%3Dtrue%26output%3Dcsv&strip-headers=on&format=html&filter01=cut&cut-include-tags01=x_route%2Cx_route%2Blandorsea%2Caffected%2Bcountryorigin%2Cx_value%2Cdate%2Byear%2Bquarter&cut-exclude-tags01=&filter02=&filter03=&filter04=&filter05=&filter06=&filter07=';

$.ajax({ 
    type: 'GET', 
    url: dataurl, 
    dataType: 'json',
    success:function(data){
        console.log('check');
        generateDashboard(hxlProxyToJSON(data));
    },
    error:function(e,err){
        console.log(err);
    }
});