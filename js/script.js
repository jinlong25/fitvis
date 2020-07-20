// import Bootstrap from 'bootstrap/dist/css/bootstrap.css';
// import * as d3 from 'd3';
// import * as moment from 'moment';
// import './style.css';

//create a namespace for common vars
var fv = {
	'top': 10,
	'right': 10,
	'bottom': 10,
	'left': 10,
	'outerWidth': 300
};

fv.outerHeight = fv.outerWidth;

fv.width = fv.outerWidth - fv.left - fv.right;
fv.height = fv.outerHeight - fv.top - fv.bottom;

//create a namespace for step
var step = {
	'outerRadius': fv.outerWidth/2,
	'barHeight': 75,
	'barWidth': 3
};
step.innerRadius = fv.outerWidth/2 - step.barHeight;

//create a namespace for sleep
var sleep = {
	'arcWidth': 5
};
sleep.radius = step.innerRadius - sleep.arcWidth,

//load data
d3.json('/data/data.json').then(function(data) {

	//subset dates from data
	//fv.dates = Object.getOwnPropertyNames(data).slice(0, 70);
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
			.style('fill', '#fff');

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

	// create scales
	step.barScale = d3.scaleLinear()
		.range([step.innerRadius, step.outerRadius])
		.domain([0, 1500]);

	step.angleScale = d3.scaleLinear()
		.range([-180, 180])
		.domain(todayExtent(date));

	step.colorScale = d3.scaleLinear()
		.domain([0, 0, 1000])
		.range(['#2c7bb6', '#ffff8c', '#d7191c'])
		.interpolate(d3.interpolateHcl);

	// create a bar wrapper
	step.barWrapper = chart.svg.append('g')
	.attr('transform', 'translate(' + 0 + ',' + 0 + ')');

	//draw bars
	step.barWrapper.selectAll('.step-bar')
		.data(step.data)
		.enter().append('rect')
		.attr('class', 'step-bar')
		.attr('transform', function(d, i) { return 'rotate(' + (step.angleScale(d['dt-la'])) + ')'; })
		.attr('width', step.barWidth)
		.attr('height', function(d, i) { return step.barScale(d.value) - step.innerRadius; })
		.attr('x', -1)
		.attr('y', step.innerRadius)
		.style('fill', function(d) { return step.colorScale(d.value); })
		.attr('data-dt', function(d) { return d['dt-la']; })
		.attr('data-steps', function(d) { return d.value; });

	//add mouseover info printing
	d3.selectAll('.step-bar').on('mouseover', function() {
		console.log(d3.select(this).attr('data-dt'));
		console.log(d3.select(this).attr('data-steps'));
	});
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
