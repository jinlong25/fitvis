//create a namespace for common vars
var fv = {
	'top': 10,
	'right': 10,
	'bottom': 10,
	'left': 10,
	'outerWidth': 200
};

fv.outerHeight = fv.outerWidth;

fv.width = fv.outerWidth - fv.left - fv.right;
fv.height = fv.outerHeight - fv.top - fv.bottom;

//create a namespace for step
var step = {
	'outerRadius': fv.outerWidth/2,
	'areaHeight': 30
};
step.innerRadius = fv.outerWidth/2 - step.areaHeight;

//create a namespace for sleep
var sleep = {
	'arcWidth': 5
};
sleep.radius = step.innerRadius - sleep.arcWidth,

//load data
d3.json('/data/data.json').then(function(data) {

	//subset dates from data
	fv.dates = Object.getOwnPropertyNames(data);

	fv.dates.forEach(function(d, i){
		//create a chart obj
		var chart = {};

		//create a new row for every 7 col
		if ( i % 7 === 0 ) {
			chart.row = d3.select('.container-fluid')
				.append('div')
				.attr('class', 'row');
		} else {
			chart.row = d3.select('.container-fluid>.row:last-child');
		}

		//create bootstrap column
		chart.container = chart.row
			.append('div')
			.attr('class', 'col-lg-1 container top-buffer');

		//enter title
		chart.container
		.append('h6')
		.attr('class', 'text-center')
		.text(d);

		//create a svg
		chart.svg = chart.container.append('svg')
				.attr('width', fv.width + fv.top + fv.right)
				.attr('height', fv.height + fv.top + fv.bottom)
				.append('g')
				.attr('transform', 'translate(' + (fv.left + fv.width) / 2 + ',' + (fv.top + fv.height/2) + ')');

		//create a background
		chart.svg.append('rect')
			.attr('width', fv.outerWidth)
			.attr('height', fv.outerHeight)
			.attr('x', -fv.outerWidth/2)
			.attr('y', -fv.outerHeight/2)
			.style('fill', '#ddd');

		//create a todayExtent
		chart.todayExtent = todayExtent(d);

		//draw things
		drawStep(data, d, chart);
		drawSleep(data, d, chart);
	});

});

//return [today 00:00:00, tomorrow 00:00:00]
function todayExtent(today) {
	var td = moment(today, 'YYYY-MM-DD');
	var tmr = moment(td);
	tmr.add(1, 'days');
	return [
		td.unix() * 1000,
		tmr.unix() * 1000
	];
}

//-----------------------------------------------------step START
function drawStep(data, date, chart) {

	//get step data
	if(data[date].hasOwnProperty('step')) {
		step.data = data[date]['steps']
	} else {
		step.data = [];
	}
	step.data = data[date]['steps']; //##verity total step later##

	//parse dt in step data
	step.data.forEach(function(d) {
		d['dt-la'] = moment(d['dt-la'], 'YYYY-MM-DD HH:mm:SS');
	});

	//define x scale
	step.x = d3.scaleTime()
		.domain(d3.extent(step.data.map(d => d['dt-la'])))
		.range([0, 2 * Math.PI]);

	//define y scale
	step.y = d3.scaleLinear()
		.domain([0, 2000])//##hard-code max value for now
		.range([step.innerRadius, step.outerRadius])

	//define area function
	step.area = d3.areaRadial()
		// .curve(d3.curveLinearClosed)
		.curve(d3.curveCardinalClosed)
		.angle(d => step.x(d['dt-la']));

	//draw step radial area chart
	chart.svg.append('path')
		.attr('fill', '#d7191c')
		.attr('d', step.area
			.innerRadius(step.y(0))
			.outerRadius(d => step.y(d.value))
			(step.data)
		);
}
//-----------------------------------------------------step END

//-----------------------------------------------------sleep START
function drawSleep(data, date, chart) {
	//get sleep data
	if(data[date].hasOwnProperty('sleep')) {
		sleep.data = data[date]['sleep'];
	} else {
		sleep.data = [];
	}

	//parse dt in sleep data
	sleep.data.forEach(function(d) {
		d['dt-la-start'] = moment(d['dt-la-start'], 'YYYY-MM-DD HH:mm:SS');
		d['dt-la-end'] = moment(d['dt-la-end'], 'YYYY-MM-DD HH:mm:SS');
	});

	//create scales
	sleep.scale = d3.scaleLinear()
		.domain(todayExtent(date))
		.range([0, 2 * Math.PI]);

	//create arc function
	sleep.arc = d3.arc()
		.innerRadius(sleep.radius)
		.outerRadius(sleep.radius + sleep.arcWidth)
		.startAngle(function(d) {
			return sleep.scale(d['dt-la-start'].unix() * 1000); })
		.endAngle(function(d) { return sleep.scale(d['dt-la-end'].unix() * 1000); });

	//draw arcs
	sleep.container = chart.svg.append('g').attr('class', 'g-sleep')
	sleep.data.forEach(function(d, i) {
		sleep.container.selectAll('.sleep-curve-' + i)
				.data([d])
				.enter().append('path')
				.attr('d', sleep.arc)
				.attr('class', 'sleep-curve-' + i)
				.style('fill', '#2c7bb6');
	});
}
//-----------------------------------------------------sleep END


//Nadieh Bremer: http://bl.ocks.org/nbremer/a43dbd5690ccd5ac4c6cc392415140e7
//Anton: https://bl.ocks.org/AntonOrlov/6b42d8676943cc933f48a43a7c7e5b6c
