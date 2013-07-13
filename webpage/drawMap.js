var width = 1000,
	height = 500,
	centered;
	zoomRender = false;

var proj = d3.geo.albersUsa()
		.scale(1300)
		.translate([width / 2, height / 2]);

var path = d3.geo.path().projection(proj);

var zoom = d3.behavior.zoom()
    .translate(proj.translate())
    .scale(proj.scale())
    .scaleExtent([height*.33, 4 * height])
    .on("zoom", zoom);

var svg = d3.select("#map").append("svg")
		.attr("width", width)
		.attr("height", height)

var g = svg.append("g");

function zoom() {
	proj.translate(d3.event.translate).scale(d3.event.scale);
	g.selectAll("path").attr("d", path);
	circles
  		.attr("cx", function(d){return proj([d.long, d.lat])[0];})
		.attr("cy", function(d){return proj([d.long, d.lat])[1];});
}

function clicked(d) {

  if (d && centered !== d) {
    centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });


  g.transition().duration(500)
  	.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")");

  d3.selectAll(".border")
    .transition().duration(500).style("stroke-width", .25 / k + "px");

  g.selectAll("path")
    .classed("active", centered && function(d) { return d === centered; });

  zoomRender = true;
}

var stateNameToAbv = {"Alabama":"AL","Alaska":"AK","American Samoa":"AS","Arizona":"AZ","Arkansas":"AR","California":"CA","Colorado":"CO","Connecticut":"CT","Delaware":"DE","District Of Columbia":"DC","Federated States Of Micronesia":"FM","Florida":"FL","Georgia":"GA","Guam":"GU","Hawaii":"HI","Idaho":"ID","Illinois":"IL","Indiana":"IN","Iowa":"IA","Kansas":"KS","Kentucky":"KY","Louisiana":"LA","Maine":"ME","Marshall Islands":"MH","Maryland":"MD","Massachusetts":"MA","Michigan":"MI","Minnesota":"MN","Mississippi":"MS","Missouri":"MO","Montana":"MT","Nebraska":"NE","Nevada":"NV","New Hampshire":"NH","New Jersey":"NJ","New Mexico":"NM","New York":"NY","North Carolina":"NC","North Dakota":"ND","Northern Mariana Islands":"MP","Ohio":"OH","Oklahoma":"OK","Oregon":"OR","Palau":"PW","Pennsylvania":"PA","Puerto Rico":"PR","Rhode Island":"RI","South Carolina":"SC","South Dakota":"SD","Tennessee":"TN","Texas":"TX","Utah":"UT","Vermont":"VT","Virgin Islands":"VI","Virginia":"VA","Washington":"WA","West Virginia":"WV","Wisconsin":"WI","Wyoming":"WY"};

var radiusScale = d3.scale.pow().exponent(.5)

var colorScale = d3.scale.quantile();

var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 1e-6)
    .style("background", "rgba(250,250,250,.7)");

queue()
	.defer(d3.json, "us-states.json")
	.defer(d3.csv, "simpleHOS.csv")
	//.defer(d3.csv, "drg/057.csv")
	.await(intialLoad);

function intialLoad(error, topology, hospitals){
	stateBorders = g.selectAll("path")
		.data(topology.features)
	.enter()
		.append("svg:path")
		.attr("d", path)
		.attr("class", "border")
		.on("click", function(d){ 
			var abv = stateNameToAbv[d.properties.name];
			clicked(d3.select(this).datum());
			state.filter( (centered != null) ? abv : null );
			setTimeout(renderAll, 500); 
		});

	circles = g.selectAll("circle").data(hospitals).enter()
			.append("circle")
				.attr("cx", function(d){ return proj([d.long, d.lat])[0]; })
				.attr("cy", function(d){ return proj([d.long, d.lat])[1]; })
				.attr("id", function(d){ return "id" + d.hosID; })
				.attr("fill", "black")
				.attr("r", .3)
		.on("mouseover", function(d){
			d3.select(this)
				.attr("stroke", "black")
				.attr("stroke-width", 1)
				.attr("fill-opacity", 1);

			tooltip
			    .style("left", (d3.event.pageX + 5) + "px")
			    .style("top", (d3.event.pageY - 5) + "px")
			    .transition().duration(300)
			    .style("opacity", 1)
			    .style("display", "block")

			console.log(d.drg.dischargeNum);
			console.log(d.hosID);

			updateDetails(d);
			})
		.on("mouseout", function(d){
			d3.select(this)
				.attr("stroke", "")
				.attr("fill-opacity", function(d){return 1;})

			tooltip.transition().duration(700).style("opacity", 0);
		});

	drgCodes = ['039 - EXTRACRANIAL PROCEDURES W/O CC/MCC', '057 - DEGENERATIVE NERVOUS SYSTEM DISORDERS W/O MCC', '064 - INTRACRANIAL HEMORRHAGE OR CEREBRAL INFARCTION W MCC', '065 - INTRACRANIAL HEMORRHAGE OR CEREBRAL INFARCTION W CC', '066 - INTRACRANIAL HEMORRHAGE OR CEREBRAL INFARCTION W/O CC/MCC', '069 - TRANSIENT ISCHEMIA', '074 - CRANIAL & PERIPHERAL NERVE DISORDERS W/O MCC', '101 - SEIZURES W/O MCC', '176 - PULMONARY EMBOLISM W/O MCC', '177 - RESPIRATORY INFECTIONS & INFLAMMATIONS W MCC', '178 - RESPIRATORY INFECTIONS & INFLAMMATIONS W CC', '189 - PULMONARY EDEMA & RESPIRATORY FAILURE', '190 - CHRONIC OBSTRUCTIVE PULMONARY DISEASE W MCC', '191 - CHRONIC OBSTRUCTIVE PULMONARY DISEASE W CC', '192 - CHRONIC OBSTRUCTIVE PULMONARY DISEASE W/O CC/MCC', '193 - SIMPLE PNEUMONIA & PLEURISY W MCC', '194 - SIMPLE PNEUMONIA & PLEURISY W CC', '195 - SIMPLE PNEUMONIA & PLEURISY W/O CC/MCC', '202 - BRONCHITIS & ASTHMA W CC/MCC', '207 - RESPIRATORY SYSTEM DIAGNOSIS W VENTILATOR SUPPORT 96+ HOURS', '208 - RESPIRATORY SYSTEM DIAGNOSIS W VENTILATOR SUPPORT <96 HOURS', '238 - MAJOR CARDIOVASC PROCEDURES W/O MCC', '243 - PERMANENT CARDIAC PACEMAKER IMPLANT W CC', '244 - PERMANENT CARDIAC PACEMAKER IMPLANT W/O CC/MCC', '246 - PERC CARDIOVASC PROC W DRUG-ELUTING STENT W MCC OR 4+ VESSELS/STENTS', '247 - PERC CARDIOVASC PROC W DRUG-ELUTING STENT W/O MCC', '249 - PERC CARDIOVASC PROC W NON-DRUG-ELUTING STENT W/O MCC', '251 - PERC CARDIOVASC PROC W/O CORONARY ARTERY STENT W/O MCC', '252 - OTHER VASCULAR PROCEDURES W MCC', '253 - OTHER VASCULAR PROCEDURES W CC', '254 - OTHER VASCULAR PROCEDURES W/O CC/MCC', '280 - ACUTE MYOCARDIAL INFARCTION, DISCHARGED ALIVE W MCC', '281 - ACUTE MYOCARDIAL INFARCTION, DISCHARGED ALIVE W CC', '282 - ACUTE MYOCARDIAL INFARCTION, DISCHARGED ALIVE W/O CC/MCC', '286 - CIRCULATORY DISORDERS EXCEPT AMI, W CARD CATH W MCC', '287 - CIRCULATORY DISORDERS EXCEPT AMI, W CARD CATH W/O MCC', '291 - HEART FAILURE & SHOCK W MCC', '292 - HEART FAILURE & SHOCK W CC', '293 - HEART FAILURE & SHOCK W/O CC/MCC', '300 - PERIPHERAL VASCULAR DISORDERS W CC', '301 - PERIPHERAL VASCULAR DISORDERS W/O CC/MCC', '303 - ATHEROSCLEROSIS W/O MCC', '308 - CARDIAC ARRHYTHMIA & CONDUCTION DISORDERS W MCC', '309 - CARDIAC ARRHYTHMIA & CONDUCTION DISORDERS W CC', '310 - CARDIAC ARRHYTHMIA & CONDUCTION DISORDERS W/O CC/MCC', '312 - SYNCOPE & COLLAPSE', '313 - CHEST PAIN', '314 - OTHER CIRCULATORY SYSTEM DIAGNOSES W MCC', '315 - OTHER CIRCULATORY SYSTEM DIAGNOSES W CC', '329 - MAJOR SMALL & LARGE BOWEL PROCEDURES W MCC', '330 - MAJOR SMALL & LARGE BOWEL PROCEDURES W CC', '372 - MAJOR GASTROINTESTINAL DISORDERS & PERITONEAL INFECTIONS W CC', '377 - G.I. HEMORRHAGE W MCC', '378 - G.I. HEMORRHAGE W CC', '389 - G.I. OBSTRUCTION W CC', '390 - G.I. OBSTRUCTION W/O CC/MCC', '391 - ESOPHAGITIS, GASTROENT & MISC DIGEST DISORDERS W MCC', '392 - ESOPHAGITIS, GASTROENT & MISC DIGEST DISORDERS W/O MCC', '394 - OTHER DIGESTIVE SYSTEM DIAGNOSES W CC', '418 - LAPAROSCOPIC CHOLECYSTECTOMY W/O C.D.E. W CC', '419 - LAPAROSCOPIC CHOLECYSTECTOMY W/O C.D.E. W/O CC/MCC', '460 - SPINAL FUSION EXCEPT CERVICAL W/O MCC', '469 - MAJOR JOINT REPLACEMENT OR REATTACHMENT OF LOWER EXTREMITY W MCC', '470 - MAJOR JOINT REPLACEMENT OR REATTACHMENT OF LOWER EXTREMITY W/O MCC', '473 - CERVICAL SPINAL FUSION W/O CC/MCC', '480 - HIP & FEMUR PROCEDURES EXCEPT MAJOR JOINT W MCC', '481 - HIP & FEMUR PROCEDURES EXCEPT MAJOR JOINT W CC', '491 - BACK & NECK PROC EXC SPINAL FUSION W/O CC/MCC', '552 - MEDICAL BACK PROBLEMS W/O MCC', '602 - CELLULITIS W MCC', '603 - CELLULITIS W/O MCC', '638 - DIABETES W CC', '640 - MISC DISORDERS OF NUTRITION,METABOLISM,FLUIDS/ELECTROLYTES W MCC', '641 - MISC DISORDERS OF NUTRITION,METABOLISM,FLUIDS/ELECTROLYTES W/O MCC', '682 - RENAL FAILURE W MCC', '683 - RENAL FAILURE W CC', '684 - RENAL FAILURE W/O CC/MCC', '689 - KIDNEY & URINARY TRACT INFECTIONS W MCC', '690 - KIDNEY & URINARY TRACT INFECTIONS W/O MCC', '698 - OTHER KIDNEY & URINARY TRACT DIAGNOSES W MCC', '699 - OTHER KIDNEY & URINARY TRACT DIAGNOSES W CC', '811 - RED BLOOD CELL DISORDERS W MCC', '812 - RED BLOOD CELL DISORDERS W/O MCC', '853 - INFECTIOUS & PARASITIC DISEASES W O.R. PROCEDURE W MCC', '870 - SEPTICEMIA OR SEVERE SEPSIS W MV 96+ HOURS', '871 - SEPTICEMIA OR SEVERE SEPSIS W/O MV 96+ HOURS W MCC', '872 - SEPTICEMIA OR SEVERE SEPSIS W/O MV 96+ HOURS W/O MCC', '885 - PSYCHOSES', '897 - ALCOHOL/DRUG ABUSE OR DEPENDENCE W/O REHABILITATION THERAPY W/O MCC', '917 - POISONING & TOXIC EFFECTS OF DRUGS W MCC', '918 - POISONING & TOXIC EFFECTS OF DRUGS W/O MCC', '948 - SIGNS & SYMPTOMS W/O MCC', '439 - DISORDERS OF PANCREAS EXCEPT MALIGNANCY W CC', '203 - BRONCHITIS & ASTHMA W/O CC/MCC', '379 - G.I. HEMORRHAGE W/O CC/MCC', '563 - FX, SPRN, STRN & DISL EXCEPT FEMUR, HIP, PELVIS & THIGH W/O MCC', '482 - HIP & FEMUR PROCEDURES EXCEPT MAJOR JOINT W/O CC/MCC', '536 - FRACTURES OF HIP & PELVIS W/O MCC', '305 - HYPERTENSION W/O MCC', '149 - DYSEQUILIBRIUM'];
	d3.select("#selectDRG")
			.on("change", function(){ updateDRGselection(this.value); })
		.selectAll("option")
			.data(drgCodes).enter().append("option")
			.attr("value", function(d){ return d; })
			.text(function(d){ return d; });


	function updateDRGselection(drgCode){
		d3.csv('drg/' + drgCode.slice(0,3) + '.csv', function(error, rawDrg){
			drg = rawDrg;		//this is probably wrong, but not sure how to nest functions

			drg.forEach(function(d){
				d.dischargeNum 	= +d.dischargeNum;
				d.avCharges 	= +d.avCharges;
				d.avPayments 	= +d.avPayments;
			});

			hosIDmap = drg.map(function(d){ return d.hosID; });
			hospitals.forEach(function(hospital){
				if (hosIDmap.indexOf(hospital.hosID) != -1){
					hospital.drg = drg[hosIDmap.indexOf(hospital.hosID)];
				}
				else{
					hospital.drg = false;
				}
			});
			
			radiusScale.range([1, 5])
						.domain(d3.extent(hospitals.map( function(d){ return d.drg ? d.drg.dischargeNum : undefined; } )));

			colorScale.range(["#FFFF66", "#FFFF00", "#E68000", "#D94000", "#CC0000"])
						.domain(hospitals.map( function(d){ return d.drg ? d.drg.avPayments : undefined; } ));
			colorScale.range(['#add8e6', '#c2a2ad', 'purple', '#eb363a', '#ff0000']);

			circles.transition().duration(1000)
				.attr("r", 	function(d){ return d.drg ? radiusScale(d.drg.dischargeNum) : .2; })
				.style("fill", function(d){ return d.drg ? colorScale(d.drg.avPayments) : 'black'; });

			vHospitals = hospitals.filter(function(d){ return d.drg; });
			vHospitalIDmap = vHospitals.map(function(d){ return d.hosID; });
			vCircles = circles.filter(function(d){ return d.drg; });
			hospitalCF = crossfilter(vHospitals);
			all = hospitalCF.groupAll();

			function getDischargeNum(d)	{ return d.drg.dischargeNum; }
			dischargeInterval = (d3.max(vHospitals, getDischargeNum) - d3.min(vHospitals, getDischargeNum))/47;

			function getavPayment(d)	{ return d.drg.avPayments; }
			paymentInterval = (d3.max(vHospitals, getavPayment) - d3.min(vHospitals, getavPayment))/47;

			function toGroup(value, interval){ return Math.floor(value/interval)*interval; }

			dischargeNum = hospitalCF.dimension(getDischargeNum),
			dischargeNums = dischargeNum.group(function(d){ return toGroup(d, dischargeInterval); }),

			avPayment = hospitalCF.dimension(getavPayment),
			avPayments = avPayment.group(function(d){ return toGroup(d, paymentInterval); }),

			state = hospitalCF.dimension(function(d){ return d.state; });
			states = state.group();

			hosID = hospitalCF.dimension(function(d){ return d.hosID; }),
			hosIDs = hosID.group();

			var charts = [
				barChart()
					.dimension(dischargeNum)
					.group(dischargeNums)
					.x(d3.scale.linear()
						.domain([	toGroup(d3.min(vHospitals, getDischargeNum), dischargeInterval), 
									toGroup(d3.max(vHospitals, getDischargeNum), dischargeInterval)*48/47])
						.rangeRound([0, 20*24]))
					.barWidth(8),

				barChart()
					.dimension(avPayment)
					.group(avPayments)
					.x(d3.scale.linear()
						.domain([	toGroup(d3.min(vHospitals, getavPayment), paymentInterval), 
									toGroup(d3.max(vHospitals, getavPayment), paymentInterval)*48/47])
						.rangeRound([0,20*24]))
					.barWidth(8)
			];

			var chart = d3.selectAll(".chart")
					.data(charts)
					.each(function(chart){ chart.on("brush", renderAll).on("brushend", renderAll) });

			d3.selectAll("#total")
					.text(hospitalCF.size());


			function render(method){
				d3.select(this).call(method);
			}


			oldFilterObject = {};
			hosIDs.all().forEach(function(d){ oldFilterObject[d.key] = d.value; });

			renderAll = function(){
				chart.each(render);
				zoomRender = false;

				newFilterObject = {};
				hosIDs.all().forEach(function(d){ newFilterObject[d.key] = d.value; });

				vCircles.filter(function(d){ return oldFilterObject[d.hosID] != newFilterObject[d.hosID]; })
						.transition().duration(500)
							.attr("r", function(d){ return 2*radiusScale(d.drg.dischargeNum)*newFilterObject[d.hosID] })
						.transition().delay(550).duration(500)
							.attr("r", function(d){ return   radiusScale(d.drg.dischargeNum)*newFilterObject[d.hosID] });

				oldFilterObject = newFilterObject;

				// d3.select("#active").text(all.value());

			}

			window.reset = function(i){
				charts[i].filter(null);
				renderAll();
			}

			renderAll();
		});
	};

	updateDRGselection(drgCodes[0]);
}

function renderAll(){}

var printDetails = [{'var': 'name', 'print': 'Name'}];
function updateDetails(metor){
	tooltip.selectAll("div").remove();
	tooltip.selectAll("div").data(printDetails).enter()
		.append("div")
			.append('span')
				.text(function(d){return d.print + ": ";})				
				.attr("class", "boldDetail")
			.insert('span')
				.text(function(d){return metor[d.var];})
				.attr("class", "normalDetail");
}
