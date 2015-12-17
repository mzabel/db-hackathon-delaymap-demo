var filters = {
    weekday: {
        label: "Wochentag",
        values: {
            MONDAY: "Montag",
            TUESDAY: "Dienstag",
            WEDNESDAY: "Mittwoch",
            THURSDAY: "Donnerstag",
            FRIDAY: "Freitag",
            SATURDAY: "Samstag",
            SUNDAY: "Sonntag"
        }
    },
    traintype: {
        label: "Zuggattung",
        values: {
            ICE: "ICX",
            S: "S",
            RE: "RE",
            RB: "RB"
        }
    },
    change: {
        label: "Verspätung/Verspätungsabbau",
        values: {
            delays: "Verspätungen",
            absoluteValues_delays: "Absolute Summe Verspätungen",
            absoluteValues_improvements: "Absolute Summe Verspätungsabbau",
            improvements: "Verspätungsabbau"
        }
    },
    week: {
        label: "Kalenderwoche",
        min: 1,
        max: 49
    }
}

var map, heatmap, invertColors=false;

init();

function init() {
    makeRadiusSlider();
    makeIntensitySlider();
    makeFilterSelector();
}

function filterTypeSelected() {
    $(".filter-value-container").hide();
    filterType = $("#filter-type-selector").val();
    if(filterType=="all") {
        selectSource("all");
    }
    else {
        $("#filter-value-selector-" + filterType).val("");
        $("#filter-value-container-" + filterType).show();
    }
}

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 6,
        center: {
            lat: 51.315979,
            lng: 9.466345
        },
        mapTypeId: google.maps.MapTypeId.MAP
    });    
    selectSource("all");
}

function makeRadiusSlider() {
    var slider = $("#radius-slider");
    slider.slider({
        max: 50
    });
    slider.on("slidechange", function(event, ui) {
        radius = slider.slider("value");
        heatmap.set("radius", radius);
        var textField = $("#radius");
        textField.text(radius);
    });
}

function makeIntensitySlider() {
    var slider = $("#intensity-slider");
    slider.on("slidechange", function(event, ui) {
        var intensity = slider.slider("value");
        heatmap.set("maxIntensity", intensity);
        var textField = $("#intensity");
        textField.text(intensity);
    });
}

function makeFilterSelector() {
    $(".filter-value-container").hide();
    var filterTypeSelector = $("#filter-type-selector");
    for (var filter in filters) {
        if (filters.hasOwnProperty(filter)) {
            var optionValue = "<option value=\""+filter+"\">"+filters[filter]["label"]+"</option>";
            filterTypeSelector.append(optionValue);
            var selector = $("#filter-value-selector-" + filter);
            if (filter == "week") {
                selector.slider({
                    min: filters[filter]["min"],
                    max: filters[filter]["max"],
                    slide: function(event,ui){
                        week = ui.value;
                        var textField = $("#weektext");
                        textField.text(week);
                    }
                });
                selector.on("slidechange", function(event, ui) {
                    week = selector.slider("value");
                    selectSource("week"+week+"_delays");
                    var textField = $("#weektext");
                    textField.text(week);
                });
            } else if(filter == "alles") {}
            else {
                var values = filters[filter]["values"];
                for (var value in values) {
                    if (values.hasOwnProperty(value)) {
                        label = values[value];
                        var optionCode = "<option value=\"" + value + "\">" + label + "</option>";
                        selector.append(optionCode);
                    }
                }
            }
        }
    }
}

function applyFilter(el) {
    var filter = $(el).val()
    invertColors = false;
    if(filter.indexOf("delays") == -1 && filter.indexOf("improvements") == -1) {
        selectSource(filter+"_delays");
    }
    else {
        if(filter.indexOf("improvements") > -1) {
            invertColors = true;
        }
        selectSource(filter);
    }
}

function updateMaxIntensity(maxIntensity) {
    var slider = $("#intensity-slider");
    slider.slider({
        max: maxIntensity
    });
}

function selectSource(source) {
    if(heatmap!=null)
        heatmap.setMap(null);
    console.log("load file: "+source);
    $.ajax({
        type: "GET",
        url: source + ".csv",
        success: function(response) {
            receivedData(response)
        }
    }); 
}

function receivedData(response) {
    data = Papa.parse(response).data;
     
    heatmap = new google.maps.visualization.HeatmapLayer({
        data: getPoints(data),
        map: map
    });
          
    if(invertColors){
          var gradient = [
            'rgba(0, 255, 255, 0)',
            'rgba(0, 255, 255, 1)',
            'rgba(0, 191, 255, 1)',
            'rgba(0, 127, 255, 1)',
            'rgba(0, 63, 255, 1)',
            'rgba(0, 0, 255, 1)',
            'rgba(0, 0, 223, 1)',
            'rgba(0, 0, 191, 1)',
            'rgba(0, 0, 159, 1)',
            'rgba(0, 0, 127, 1)',
            'rgba(63, 0, 91, 1)',
            'rgba(127, 0, 63, 1)',
            'rgba(191, 0, 31, 1)',
            'rgba(255, 0, 0, 1)'
          ]
          heatmap.set('gradient', gradient);
    }
    
    $("#radius-slider").slider("value", 16);
    $("#intensity-slider").slider("value", 500);
}

function getPoints(data) {
    var result = [];
    max = 0.0;
    for (var i = 0; i < data.length; i++) {
        var point = data[i];
        var intensity = parseFloat(point[0]);
        if (intensity > max) {
            max = intensity;
        }
        var lat = parseFloat(point[1]);
        var lng = parseFloat(point[2]);
        var el = {
            location: new google.maps.LatLng(lat, lng),
            weight: intensity
        };
        result.push(el);
    }
    updateMaxIntensity(max);

    return result;
}