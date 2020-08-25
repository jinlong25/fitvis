//create a namespace for common vars
var fv = {
	'top': 10,
	'right': 10,
	'bottom': 10,
	'left': 10,
	'radius': 95
};

fv.width = fv.radius*2 - fv.left - fv.right;
fv.height = fv.radius*2 - fv.top - fv.bottom;


//create a namespace for heart rate
var hr = {

};

//create a namespace for step
var step = {
	'outerRadius': fv.radius,
	'areaHeight': 50
};
step.innerRadius = fv.radius - step.areaHeight;

//create a namespace for sleep
var sleep = {
	'arcWidth': 5
};
sleep.radius = step.innerRadius - sleep.arcWidth,

//load data
d3.json('/data/data.json').then(function(data) {

	// console.log(data['2020-07-01']['heart-rate']);

	//subset dates from data
	fv.dates = Object.getOwnPropertyNames(data);

	fv.dates.forEach(function(d, i){
		//create a chart obj
		var chart = {};

		//create bootstrap column
		chart.container = d3.select('.canvas')
			.append('div')
			.attr('class', 'container')
			.style('position', 'absolute')
			.style('left', moment(d).day() * fv.radius * 2 + 'px' )
			.style('top', (moment(d).week() - 1) * fv.radius * 2 + 'px' )

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
		// chart.svg.append('rect')
		// 	.attr('width', fv.radius*2)
		// 	.attr('height', fv.radius*2)
		// 	.attr('x', -fv.radius)
		// 	.attr('y', -fv.radius)
		// 	.style('fill', '#ddd');

		//create a todayExtent
		chart.todayExtent = todayExtent(d);

		//draw things
		drawStep(data, d, chart);
		drawHr(data, d, chart);
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

//-----------------------------------heart rate START
function drawHr(data, date, chart) {

	//get hr data
	if(data[date].hasOwnProperty('heart-rate')) {
		hr.data = data[date]['heart-rate']
	} else {
		hr.data = [];
	}
	hr.data = data[date]['heart-rate']; //##verity total step later##

	//parse dt in step data
	hr.data.forEach(function(d) {
		d['dt-la'] = moment(d['dt-la'], 'YYYY-MM-DD HH:mm:SS');
	});

	//define x scale
	hr.x = d3.scaleTime()
		.domain(d3.extent(hr.data.map(d => d['dt-la'])))
		.range([0, 2 * Math.PI]);

	//define y scale
	hr.y = d3.scaleLinear()
		.domain([40, 150])//##hard-code max value for now
		.range([step.innerRadius - 10, step.outerRadius])

	//define area function
	hr.line = d3.lineRadial()
		// .curve(d3.curveLinearClosed)
		.curve(d3.curveLinearClosed)
		.angle(d => hr.x(d['dt-la']));

	//draw step radial area chart
	chart.svg.append('path')
		.attr('fill', 'none')
		.attr('stroke', 'red')
		.attr('stroke-width', .5)
		.attr('d', hr.line.radius(d => hr.y(d.value))
			(hr.data)
		);
}
//--------------------------------heart rate END

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
		.domain([0, 2200])//##hard-code max value for now
		.range([step.innerRadius, step.outerRadius])

	//define gradient for steps
	chart.svg.append('defs')
		.append('radialGradient')
		.attr('id', 'step-gradient')
		.attr('cx', '50%')
		.attr('cy', '50%')
		.attr('r', '50%')
		.selectAll('stop')
		.data([
			{offset: '0%', color: 'white'},
			{offset: '60%', color: 'yellow'},
			{offset: '100%', color: 'red'}
		])
		.enter().append('stop')
		.attr('offset', function(d) { return d.offset; })
		.attr('stop-color', function(d) { return d.color; });

	//define area function
	step.area = d3.areaRadial()
		// .curve(d3.curveLinearClosed)
		.curve(d3.curveCardinalClosed)
		.angle(d => step.x(d['dt-la']));

	//draw step radial area chart
	chart.svg.append('path')
		// .attr('fill', '#d7191c')
		.attr('fill', 'url(#step-gradient)')
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
