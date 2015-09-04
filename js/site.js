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
    var cf = crossfilter(data);

    var timeDimension = cf.dimension(function(d){return d['#date+year+quarter'];});
    var methodDimension = cf.dimension(function(d){return d['#x_route+landorsea']});
    var countryDimension = cf.dimension(function(d){return d['#affected+countryorigin']});
    var routeDimension = cf.dimension(function(d){return d['#x_route']+d['#x_route+landorsea']});

    var timeGroup = timeDimension.group().reduceSum(function(d){return d['#x_value']});
    var methodGroup = methodDimension.group().reduceSum(function(d){return d['#x_value']});
    var countryGroup = countryDimension.group().reduceSum(function(d){return d['#x_value']});
    var routeGroup = routeDimension.group().reduceSum(function(d){return d['#x_value']});
    var totalGroup = cf.groupAll().reduceSum(function(d){return d['#x_value']});

    

    timeChart = dc.barChart('#time').height(150).width($('#time').width())
        .dimension(timeDimension)
        .group(timeGroup)
        .x(d3.scale.ordinal().domain(quarters))
        .xUnits(dc.units.ordinal)
        .elasticY(true)
        .margins({top: 10, right: 50, bottom: 50, left: 50});

    timeChart.yAxis().ticks(3);

    var methodChart = dc.pieChart('#entrytype').height(150).width($('#entrytype').width())
        .dimension(methodDimension)
        .group(methodGroup);

    var countryChart = dc.rowChart('#country').height(670).width($('#country').width())
        .dimension(countryDimension)
        .group(countryGroup)
        .data(function(group){
                return group.top(25);
        })
        .colors(['#cccccc',color])
        .colorDomain([0,1])
        .colorAccessor(function(d, i){return 1;})        
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
            return feature.properties['Route_name']+feature.properties['landorsea'];
        })
        .colors(colors)
        .colorDomain([0, 4])
        .colorAccessor(function (d) {
            var c=0;
            if (d>5000) {
                c=4;
            } else if (d>1000) {
                c=3;
            } else if (d>500) {
                c=2;
            } else if (d>0){
                c=1
            } 
            return c;
            })
        .widthAccessor(function (d) {
            var c=2;
            if (d>5000) {
                c=6;
            } else if (d>1000) {
                c=5;
            } else if (d>500) {
                c=4;
            } else if (d>0){
                c=3
            } 
            return c;
            })   
        .popup(function(feature){
            return 'Click to filter <br />'+feature.properties['Route_name'] +' by '+feature.properties['landorsea'];
        })
        .renderPopup(true);

    var numberRefugees = dc.numberDisplay("#number")
        .valueAccessor(function(d){
            return d
        })
        .formatNumber(function(d){
            return d3.format("0,000")(parseInt(d));;
        })           
        .group(totalGroup);        

    dc.renderAll();

    map = mapChart.map();
    map.scrollWheelZoom.disable();
    zoomToGeom(routes_geom);        
}

    function zoomToGeom(geom){
        var bounds = d3.geo.bounds(geom);
        map.fitBounds([[bounds[0][1],bounds[0][0]],[bounds[1][1],bounds[1][0]]]);
    }   

function autoAdvance(){
    if(time==25){
        timeChart.filter([quarters[time-1]]);
        dc.redrawAll();
        time+=1;
        clearInterval(timer);
    }    
    if(time<25 && time>0){
        timeChart.filter([quarters[time-1]]);
        timeChart.filter([quarters[time]]);
        dc.redrawAll();
        time+=1;
    }
    if(time==0){
        timeChart.filter([quarters[time]]);
        dc.redrawAll();
        time+=1;
    }    
} 

function dataReplace(data){
    var routeReplace = [
        'Western Balkan Route',
        'Black sea Route',
        'Central Mediterranean Route',
        'Circular Route from Albania to Greece',
        'Eastern borders Route',
        'Eastern Mediterranean Route',
        'Western African Route',
        'Western Mediterranean Route'
    ];

    data.forEach(function(d,i){
        if(i>0){
            d[0]=routeReplace[d[0]];
        }
    })
    return data;
}

var colors = ['#ccc','#ffffb2','#fecc5c','#fd8d3c','#e31a1c'];

var color = '#1f77b4';

var dataurl = 'http://proxy.hxlstandard.org/data.json?filter_count=7&url=https%3A//docs.google.com/spreadsheets/d/10F5vls-WgM6tj9RgK3TKOjYEtXDAapcxDFfh1tuXkzc/pub%3Fgid%3D0%26single%3Dtrue%26output%3Dcsv&strip-headers=on&format=html&filter01=cut&cut-include-tags01=x_route%2Cx_route%2Blandorsea%2Caffected%2Bcountryorigin%2Cx_value%2Cdate%2Byear%2Bquarter&cut-exclude-tags01=&filter02=&filter03=&filter04=&filter05=&filter06=&filter07=';

var time;
var timeChart;

var quarters = ['2009 Q1','2009 Q2','2009 Q3','2009 Q4','2010 Q1','2010 Q2','2010 Q3','2010 Q4','2011 Q1','2011 Q2','2011 Q3','2011 Q4','2012 Q1','2012 Q2','2012 Q3','2012 Q4','2013 Q1','2013 Q2','2013 Q3','2013 Q4','2014 Q1','2014 Q2','2014 Q3','2014 Q4','2015 Q1'];
var timer
$('#modal').modal('show'); 
$.ajax({ 
    type: 'GET', 
    url: dataurl, 
    dataType: 'json',
    success:function(data){
        generateDashboard(hxlProxyToJSON(dataReplace(data)));
        $('#modal').modal('hide'); 
    },
    error:function(e,err){
        console.log(err);
    }
});

$('#timeplay').on('click',function(){
    time =0;
    timer = setInterval(function(){autoAdvance()}, 1000);
});

$('#clearfilters').on('click',function(){
    dc.filterAll();
    dc.redrawAll();
    zoomToGeom(routes_geom);
});

$('#intro').click(function(){
    var intro = introJs();
        intro.setOptions({
            steps: [
              {
                element: '#country',
                intro: "This graph shows the number of people entering by country of origin.  A country or multiple countries can be clicked to filter the dashboard.",
                position: 'left'
              },
              {
                element: '#entrytype',
                intro: "This graph highlights the method used on the migration route.  It can be clicked to filter for land or sea.",
              },
              {
                element: '#time',
                intro: "Here we can see the number of people entering by quarter by year.  Click a bar or multiple bars to see data for that quarter.  The animate button can be used to progress time automatically.  You could for example click Syria as country of origin and then click animate to see how Syrian entries have evolved over time.",
              },
              {
                element: '#map',
                intro: "The map can zoomed and panned.  Click a migration route to filter the dashboard for that route.",
              },
              {
                element: '#total',
                intro: "This number is the total number of refugees and migrants that match the selected filters on the graphs and map.",
              },
              {
              element: '#clearfilters',
                intro: "Click here at anytime to reset the dashboard.",
              },                           
            ]
        });  
    intro.start();
});