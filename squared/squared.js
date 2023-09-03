/////////////////////////////////////
// ATTENTION CONTROL SQUARED TASKS //
////////////////////////////////////

/*
2023-02-01: Made by Van Liceralde on jsPsych v7.3
			- Descriptions in Burgoyne et al. are slightly different from the implementation in the program available on the Engle Lab website, VL
			  decided to stick to Burgoyne et al. description because it gave participants feedback at the end and provided reason for why the correct
			  response was correct

References:
Liceralde, V.R.T. & Burgoyne, A.P. Squared Tasks on jsPsych (Version 1.0) [Computer software].

Burgoyne, A.P., Tsukahara, J.S., Mashburn, C.A., Pak, R., Engle, R.W. (2023). Nature and measurement of attention control. Journal of Experimental Psychology: General.
(under review when task was first ported by VL)

/*
Overview:
This is a jsPsych implementation of the new squared tasks of attention control from Burgoyne et al.
For each task, a 30-second practice block is given, followed by a 90-second main block.
For the Stroop squared: Participants have to determine the color of the prompt and click on the word
whose meaning corresponds to the prompt's color. For the Flanker squared: Participants are given a 
choice of two arrow sets and they have to click the arrow set whose center arrow points in the same
direction as the flanking arrows in the prompt. For the Simon squared: Participants are shown an
arrow prompt at the left or right of the screen, and they have to click on the word that indicates
the direction that the arrow prompt is pointing (not its location).  

To Use:
1. Load this js file in your html file (here, it's squared.html).
	a. On Cognition.run / Gorilla.sc, you may have to copy and paste this entire file onto the main syntax/code page
	   and have Cognition.run or Gorilla.sc call on the main syntax code instead and possibly make necessary edits
	   for the specific platform
2. Upload all companion files (.css and .img files)
3. Reference the css in your html file (here, it's squared.css)
*/

///////////////////////////////////////////
// DEFINE TIMELINE AND GENERAL VARIABLES //
///////////////////////////////////////////

// new to v7: Initialize jsPsych, this initialization should happen before the rest of the jsPsych code is called
var jsPsych = initJsPsych({});

// Set the seed for reproducible experiment runs. Use a different seed for a different fixed randomized order.
// If trials should be kept constant across runs, uncomment next line.
// jsPsych.randomization.setSeed('squaredtasks');

// IMPORTANT: THESE ARE THE ONLY VARIABLES THAT SHOULD BE MANUALLY CHANGED (if at all), the rest should be adaptive
var practice_duration = 30000; // duration of practice
var main_duration = 90000; // duration of main task

//general variables for use throughout the experiment
var online; // Numeric: 0 indicating that task is being run locally, 1 indicating that the task is being run through a platform
var subject; // Subject ID
var total_stroop = 0; // track total Stroop score
var total_flanker = 0; // track total Flanker score
var total_simon = 0; // track total Simon score
var block_trial_count = 0;
var practice = 1; // Indicator of whether the trials being shown belong to the practice phase
var timeout = 0; // Indicator whether trial was responded to when the task timed out
var timeleft; // Placeholder for the amount of time left for the block
var block_time_limit; // Placeholder for the timelimit for the block
var end_timer; // Holder for timeout of task
var block_start; // Placeholder for time when block started
var stay = 1; // Indicator of whether participant has indicated that they still want to read the instructions

var items_stroop = Array.from(Array(16).keys()); // Array from 0-15
var items_flanker = Array.from(Array(16).keys()); // Array from 0-15
var items_simon = Array.from(Array(8).keys()); // Array from 0-7

// Function to countdown to 0
// setInterval is a built in function that calls the function in the first argument at the every time interval in ms specified in the second argument
function countdown(start, timelimit) {

	var timeleft_bar = document.getElementById("timeleft");
	var timeleft_width = (timelimit - (Date.now() - start))*100/timelimit;
	timeleft_bar.style.width = timeleft_width + "%";
	
	function shorten_timebar() {
		if (timeleft_width <= 0) {
			clearInterval(update_timeleft)
		} else {
			timeleft_width -= 10*100/timelimit // 10: time interval set in setInterval;
			timeleft_bar.style.width = timeleft_width + "%";
		}
	}

	var update_timeleft = setInterval(shorten_timebar, 10);
}

///////////////////////////////////////////
// INITIALIZE EXPERIMENT CONTEXT  /////////
///////////////////////////////////////////

// Initialize timeline
var timeline = [];

var enter_fullscreen = {
	type: jsPsychFullscreen,
	fullscreen_mode: true
}

var get_participant_id = {
	type: jsPsychSurveyText,
	questions: [
		{prompt: 'Please enter the participant ID:', required: true, name: 'participant_id'}
	],
	on_finish: function(data) {
		jsPsych.data.addProperties({
			  participant_id: data.response.participant_id
		  })

		subject = data.response.participant_id;
	  }
}

// get_location: Introduces option to run program (and save files) locally or to run it online and collect data through a platform
// Comment out get_location object if implementing a default of running the task online
var get_location = {
	type: jsPsychSurveyMultiChoice,
	questions: [{
			prompt: "Where are you running the task?",
			name: "client",
			options: ["Online (cognition.run, gorilla.sc, MTurk link)", "Local (Lab computer files)"],
			required: true
		}],
	on_finish: function(data) {
		online = data.response.client == "Online (cognition.run, gorilla.sc, MTurk link)" ? 1 : 0;
	}
}

var welcome = {
	type: jsPsychHtmlButtonResponse,
	stimulus: "<p style='font-size:25px;'><b>Colors and Arrows Tasks</b></p>" +
			  "<p style='font-size:25px;'>Click on START to read the instructions.</p>",
	choices: ["START"]
}

//////////////////////////////////////////////
///////////////// STROOP /////////////////////
//////////////////////////////////////////////

// 1. Create object that has all the possible stimuli for the task (stimuli_stroop)
// 2. Create fixed random order of trials for practice and main phases of task (practice_stroop, main_stroop)
// 3. Create timeline objects
//		a. intro_stroop timeline
//			a1. instructions_stroop_1
//      	a2. prepare_practice_stroop
//      b. threetwoone countdown
//		c. block_stroop_practice -> practice trials
//      d. premain_stroop timeline
//			d1. instructions_stroop_2
//			d2. prepare_main_stroop
//		e. threetwoone countdown
//		f. block_main_stroop -> main task
//		g. conclusion_stroop -> reports final score to participant

// 1. Create object that has all the possible stimuli for the task (stimuli_stroop)
var stimuli_stroop = [
	{stim: "RED", stimcolor: "#ff0302", resp1: "BLUE", resp1color: "#0000FF", resp2: "RED", resp2color: "#ff0302", correct_response: 1, condition: 1},
	{stim: "RED", stimcolor: "#ff0302", resp1: "RED", resp1color: "#ff0302", resp2: "BLUE", resp2color: "#0000FF", correct_response: 0, condition: 1},
	{stim: "BLUE", stimcolor: "#0000FF", resp1: "BLUE", resp1color: "#0000FF", resp2: "RED", resp2color: "#ff0302", correct_response: 0, condition: 1},
	{stim: "BLUE", stimcolor: "#0000FF", resp1: "RED", resp1color: "#ff0302", resp2: "BLUE", resp2color: "#0000FF", correct_response: 1, condition: 1},
	{stim: "RED", stimcolor: "#ff0302", resp1: "RED", resp1color: "#0000FF", resp2: "BLUE", resp2color: "#ff0302", correct_response: 0, condition: 2},
	{stim: "RED", stimcolor: "#ff0302", resp1: "BLUE", resp1color: "#ff0302", resp2: "RED", resp2color: "#0000FF", correct_response: 1, condition: 2},
	{stim: "BLUE", stimcolor: "#0000FF", resp1: "RED", resp1color: "#0000FF", resp2: "BLUE", resp2color: "#ff0302", correct_response: 1, condition: 2},
	{stim: "BLUE", stimcolor: "#0000FF", resp1: "BLUE", resp1color: "#ff0302", resp2: "RED", resp2color: "#0000FF", correct_response: 0, condition: 2},
	{stim: "RED", stimcolor: "#0000FF", resp1: "BLUE", resp1color: "#0000FF", resp2: "RED", resp2color: "#ff0302", correct_response: 0, condition: 3},
	{stim: "RED", stimcolor: "#0000FF", resp1: "RED", resp1color: "#ff0302", resp2: "BLUE", resp2color: "#0000FF", correct_response: 1, condition: 3},
	{stim: "BLUE", stimcolor: "#ff0302", resp1: "BLUE", resp1color: "#0000FF", resp2: "RED", resp2color: "#ff0302", correct_response: 1, condition: 3},
	{stim: "BLUE", stimcolor: "#ff0302", resp1: "RED", resp1color: "#ff0302", resp2: "BLUE", resp2color: "#0000FF", correct_response: 0, condition: 3},
	{stim: "RED", stimcolor: "#0000FF", resp1: "RED", resp1color: "#0000FF", resp2: "BLUE", resp2color: "#ff0302", correct_response: 1, condition: 4},
	{stim: "RED", stimcolor: "#0000FF", resp1: "BLUE", resp1color: "#ff0302", resp2: "RED", resp2color: "#0000FF", correct_response: 0, condition: 4},	
	{stim: "BLUE", stimcolor: "#ff0302", resp1: "RED", resp1color: "#0000FF", resp2: "BLUE", resp2color: "#ff0302", correct_response: 0, condition: 4},
	{stim: "BLUE", stimcolor: "#ff0302", resp1: "BLUE", resp1color: "#ff0302", resp2: "RED", resp2color: "#0000FF", correct_response: 1, condition: 4}	
]

// 2. Create fixed random order of trials for practice and main phases of task (practice_stroop, main_stroop)
var practice_stroop = jsPsych.randomization.sampleWithReplacement(items_stroop, 100);
var main_stroop = jsPsych.randomization.sampleWithReplacement(items_stroop, 500);

// 3a.1 
var instructions_stroop_1 = {
	type: jsPsychHtmlButtonResponse,
	stimulus: `<p style='font-size: 15pt; text-align: left;'>See what color the top word is. Select that color from the two options below. DON'T<br>
				pay attention to what the top word says or the color of the two options below. It's<br>
				important to match the color of the top word with the meaning of the word below.<br>
				We will begin with a practice round. You will have 30 seconds to earn as many points<br>
				as possible.</p>
				<div style='height: 100px;'></div>
				<p style='font-size: 9pt;'>WORD IS IN BLUE COLOR</p>
				<span style='font-size: 54pt; font-weight: 1000; color: #0000FF;'>RED</span><p><br></p>
				<div><button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: #0000FF;"><div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>RED<div style="font-size: 9pt; color: white; font-weight: normal;">WRONG ANSWER<br>(Meaning does not match top word's color)</div></button><div class="space"></div>
				<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: #ff0302;"><div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>BLUE<div style="font-size: 9pt; color: white; font-weight: normal;">RIGHT ANSWER<br>(Meaning matches top word's color)</div></button></div>`,
	choices: ["Begin practice"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		data.task = "stroop";
	}
}

// 3a.2
var prepare_practice_stroop = {
	type: jsPsychHtmlButtonResponse,
	stimulus: "<div style='font-size: 10pt; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_stroop + "</b></span></div></div><div style='height: 150px;'></div>" +
				"<p style='font-size: 54pt; font-weight: 1000; color: black;'>_</p>" ,
	choices: ["Review instructions again", "Start practice trials"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		stay = data.response == 0 ? 1 : 0;
		data.task = "stroop";
		practice = 1;
	}
}

// 3a
var intro_stroop = {
	timeline: [instructions_stroop_1, prepare_practice_stroop],
	on_timeline_start: function() {
		stay = 1;
		timeout = 0;
	},
	loop_function: function() {
		return stay;
	},
	on_timeline_end: function() {	
		stay = 1;
	}
}

// 3b & 3e
var threetwoone = {
	timeline: [{
		type: jsPsychHtmlKeyboardResponse,
		stimulus: function() { return "<div style='font-size: 10pt; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>0</b></span></div></div><div style='height: 89px;'></div>" +
					"<p style='font-size: 120pt; font-weight: 1000;'>" + jsPsych.timelineVariable("num") + "</p>" },
		choices: "NO_KEYS",
		trial_duration: 1000
	}],
	timeline_variables: [{num: 3}, {num: 2}, {num: 1}]
}

// 3d.1
var instructions_stroop_2 = {
	type: jsPsychHtmlButtonResponse,
	stimulus: `<p style='font-size: 15pt; text-align: left;'>That's it for practice. Please review the instructions one last time. See what color the top<br>
				word is. Select that color from the two options below. DON'T pay attention to what<br>
				the top word says or the color of the two options below. It's important to match the<br>
				color of the top word with the meaning of the word below. You will have 90 seconds<br>
				to earn as many points as possible.</p>
				<div style='height: 100px;'></div>
				<p style='font-size: 9pt;'>WORD IS IN BLUE COLOR</p>
				<span style='font-size: 54pt; font-weight: 1000; color: #0000FF;'>RED</span><p><br></p>
				<div><button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: #0000FF;"><div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>RED<div style="font-size: 9pt; color: white; font-weight: normal;">WRONG ANSWER<br>(Meaning does not match top word's color)</div></button><div class="space"></div>
				<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: #ff0302;"><div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>BLUE<div style="font-size: 9pt; color: white; font-weight: normal;">RIGHT ANSWER<br>(Meaning matches top word's color)</div></button></div>`,
	choices: ["I understand"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		data.task = "stroop";
	}
}

// 3d.2
var prepare_main_stroop = {
	type: jsPsychHtmlButtonResponse,
	stimulus: "<div style='font-size: 10pt; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_stroop + "</b></span></div></div><div style='height: 150px;'></div>" +
				"<p style='font-size: 54pt; font-weight: 1000; color: black;'>_</p>",
	choices: ["Review instructions again", "Start task"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		stay = data.response == 0 ? 1 : 0;
		data.task = "stroop";
		practice = 0;
		clearTimeout(end_timer);
	}
}

// 3d
var premain_stroop = {
	timeline: [instructions_stroop_2, prepare_main_stroop],
	on_timeline_start: function() {
		total_stroop = 0;
		timeout = 0;
	},
	loop_function: function() {
		return stay;
	},
	on_timeline_end: function() {
		stay = 1;
	}
}

// Function to create display stimulus + countdown bar
var display_stroop = function(stimulus) {
	var stim = stimuli_stroop[stimulus].stim;
	var stimcolor = stimuli_stroop[stimulus].stimcolor;

	return "<div style='font-size: 10pt; position: relative; left: 5%; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_stroop + "</b></span></div></div><div style='height: 143px;'></div>" +
	"<span style='font-size: 54pt; font-weight: 1000; color: " + stimcolor + ";'>" + stim + "</span><p><br></p>"
}


// Function to create block of stroop trials
// 		- stroop: Array containing the indices of stimuli_stroop to be referenced as nth trials for that block
var createStroopBlock = function(stroop) {
	var trial_stroop = {
		type: jsPsychHtmlButtonResponse,
		stimulus: function() { return display_stroop(stroop[block_trial_count]); },
		choices: function() { return [stimuli_stroop[stroop[block_trial_count]].resp1, stimuli_stroop[stroop[block_trial_count]].resp2]; },
		button_html: function() {
			var resp1color = stimuli_stroop[stroop[block_trial_count]].resp1color;
			var resp2color = stimuli_stroop[stroop[block_trial_count]].resp2color;
	
			var choice1 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: ' + resp1color + ';"><div style="color: black; font-size: 34pt; font-weight: 200;">_</div>%choice%</button>'
			var choice2 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: ' + resp2color + ';"><div style="color: black; font-size: 34pt; font-weight: 200;">_</div>%choice%</button>'
			
			return [choice1, choice2];
		},
		margin_horizontal: '53px',
		on_start: function() {
			// Set up timer if it's the first trial
			if (block_trial_count == 0) {
				block_time_limit = practice == 1 ? practice_duration : main_duration;
				block_start = Date.now();			
	
				end_timer = setTimeout(function() {
	
					block_trial_count = 0;
					timeout = 1;
					
					// console.log("Block timed out at this trial", block_trial_count, timeout); // Here to debug
							
					// this function is all you need to end the current timeline
					jsPsych.endCurrentTimeline();
					
				}, block_time_limit);
			}		
		},
		on_load: function() {
			countdown(block_start, block_time_limit);
		},
		on_finish: function(data) {
			data.block_trial_count = timeout == 1 ? block_trial_count : block_trial_count + 1;
			data.task = "stroop";
			data.practice = practice;
			data.item = stroop[block_trial_count];
			data.stim = stimuli_stroop[stroop[block_trial_count]].stim;
			data.stimcolor = stimuli_stroop[stroop[block_trial_count]].stimcolor == "#0000FF" ? "blue" : "red";
			data.resp1 = stimuli_stroop[stroop[block_trial_count]].resp1;
			data.resp1color = stimuli_stroop[stroop[block_trial_count]].resp1color == "#0000FF" ? "blue" : "red";
			data.resp2 = stimuli_stroop[stroop[block_trial_count]].resp2;
			data.resp2color = stimuli_stroop[stroop[block_trial_count]].resp2color == "#0000FF" ? "blue" : "red",
			data.correct_response = stimuli_stroop[stroop[block_trial_count]].correct_response;
			data.condition = stimuli_stroop[stroop[block_trial_count]].condition;
			data.accuracy = data.response == stimuli_stroop[stroop[block_trial_count]].correct_response ? 1 : 0;
			data.timeout = timeout;

			switch(timeout) {
				case 0:
					total_stroop = data.accuracy == 1 ? total_stroop + 1 : total_stroop - 1;
					break;
				case 1:
					total_stroop = total_stroop;
					break;
			}

			data.score_after_trial = total_stroop;
			
			// console.log(data, block_time_limit - (Date.now()-block_start), (Date.now() - block_start)) // Here to debug
		}
	}
	
	var feedback_stroop = {
		type: jsPsychHtmlButtonResponse,
		stimulus: function() { return display_stroop(stroop[block_trial_count]); },
		choices: function() { return [stimuli_stroop[stroop[block_trial_count]].resp1, stimuli_stroop[stroop[block_trial_count]].resp2]; },
		button_html: function() {
			var resp1color = stimuli_stroop[stroop[block_trial_count]].resp1color;
			var resp2color = stimuli_stroop[stroop[block_trial_count]].resp2color;
			var resp = jsPsych.data.get().last(1).values()[0].response;
			var correct_response = jsPsych.data.get().last(1).values()[0].correct_response;
	
			switch (resp) {
				case 0:
					var feedback1 = correct_response == 0 ? '<div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>' : '<div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>';
					var feedback2 = '<div style="color: black; font-size: 34pt; font-weight: 200;">_</div>';
					break;
				case 1:
					var feedback1 = '<div style="color: black; font-size: 34pt; font-weight: 200;">_</div>';
					var feedback2 = correct_response == 1 ? '<div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>' : '<div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>';
					break;
			}
	
			var choice1 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: ' + resp1color + ';">' + feedback1 + '%choice%</button>'
			var choice2 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: ' + resp2color + ';">' + feedback2 + '%choice%</button>'
	
			return [choice1, choice2];
		},
		margin_horizontal: '53px',
		on_start: function() {
			block_trial_count++
		},
		on_load: function() {
			countdown(block_start, block_time_limit);
			
		},
		trial_duration: 500,
		response_ends_trial: false
	}
	
	var block_stroop = {
		timeline: [trial_stroop, feedback_stroop],
		loop_function: function() {
			return true;
		}
	}

	return block_stroop;
}

// 3c & 3f
block_stroop_practice = createStroopBlock(practice_stroop);
block_stroop_main = createStroopBlock(main_stroop);

// 3g
var conclusion_stroop = {
	type: jsPsychHtmlButtonResponse,
	stimulus: function() {return `<p>You earned a total of ` + total_stroop + ` points for that task. Great job!</p><p>Click on NEXT TASK to move on.</p>`; },
	choices: ["NEXT TASK"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_start: function() {
		// Calculate the following metrics separately for practice trials and main trials, filtering out the trial where the block timed out:
		//     - score_final: final score of the participant at the end of the block
		//	   - meanrt_final: mean RT of all trials across the block (regardless of accuracy)
		//     - score_x: score of the participant for x condition calculated as correct - incorrect for trials in x condition, where x is as follows:
		//			1. fully congruent
		//			2. stim congruent resp incongruent
		//			3. stim incongruent resp congruent
		//          4. fully incongruent
		//	   - meanrt_x: mean RT of all trials for x condition (regardless of accuracy)

		jsPsych.data.get().filter({task: "stroop", practice: 1}).addToAll({
			score_final: jsPsych.data.get().filter({task: "stroop", practice: 1, timeout: 0}).last(1).values()[0].score_after_trial,
			meanrt_final: jsPsych.data.get().filter({task: "stroop", practice: 1, timeout: 0}).select("rt").mean(),
			score_1: jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 1, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 1, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_1: jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 1, timeout: 0}).select("rt").mean(),
			score_2: jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 2, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 2, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_2: jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 2, timeout: 0}).select("rt").mean(),
			score_3: jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 3, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 3, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_3: jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 3, timeout: 0}).select("rt").mean(),
			score_4: jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 4, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 4, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_4: jsPsych.data.get().filter({task: "stroop", practice: 1, condition: 4, timeout: 0}).select("rt").mean()
		})

		jsPsych.data.get().filter({task: "stroop", practice: 0}).addToAll({
			score_final: jsPsych.data.get().filter({task: "stroop", practice: 0, timeout: 0}).last(1).values()[0].score_after_trial,
			meanrt_final: jsPsych.data.get().filter({task: "stroop", practice: 0, timeout: 0}).select("rt").mean(),
			score_1: jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 1, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 1, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_1: jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 1, timeout: 0}).select("rt").mean(),
			score_2: jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 2, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 2, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_2: jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 2, timeout: 0}).select("rt").mean(),
			score_3: jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 3, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 3, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_3: jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 3, timeout: 0}).select("rt").mean(),
			score_4: jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 4, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 4, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_4: jsPsych.data.get().filter({task: "stroop", practice: 0, condition: 4, timeout: 0}).select("rt").mean()
		})

		if (online == 0) {
			var filename = "data_squared-stroop_" + subject + ".csv";
			jsPsych.data.get().filter({task: "stroop"}).localSave('csv', filename);
		}
		clearTimeout(end_timer);
	}
}

// Put timeline together
var stroop_task = { timeline: [intro_stroop, threetwoone, block_stroop_practice, premain_stroop, threetwoone, block_stroop_main, conclusion_stroop] };

///////////////////////////////////////////////
///////////////// FLANKER /////////////////////
///////////////////////////////////////////////

// 1. Create object that has all the possible stimuli for the task (stimuli_flanker)
// 2. Create fixed random order of trials for practice and main phases of task (practice_flanker, main_flanker)
// 3. Create timeline objects
//		a. intro_flanker timeline
//			a1. instructions_flanker_1
//      	a2. prepare_practice_flanker
//      b. threetwoone countdown
//		c. block_flanker_practice -> practice trials
//      d. premain_flanker timeline
//			d1. instructions_flanker_2
//			d2. prepare_main_flanker
//		e. threetwoone countdown
//		f. block_main_flanker -> main task
//		g. conclusion_flanker -> reports final score to participant

// Possible stimuli
// 	  - ar:     all right
//    - al:     all left
//    - mr_fl:  mid right, flankers left
//	  - ml_fr:  mid left, flankers right

const ar = "ar.PNG";
const al = "al.PNG";
const mr_fl = "mr_fl.PNG";
const ml_fr = "ml_fr.PNG";

// 1. Create object that has all the possible stimuli for the task (stimuli_flanker)
var stimuli_flanker = [
	{stim: al, stimsign: "<<<<<", resp1: ar, resp1sign: ">>>>>", resp2: al, resp2sign: "<<<<<", correct_response: 1, condition: 1},
	{stim: al, stimsign: "<<<<<", resp1: al, resp1sign: "<<<<<", resp2: ar, resp2sign: ">>>>>", correct_response: 0, condition: 1},
	{stim: ar, stimsign: ">>>>>", resp1: ar, resp1sign: ">>>>>", resp2: al, resp2sign: "<<<<<", correct_response: 0, condition: 1},
	{stim: ar, stimsign: ">>>>>", resp1: al, resp1sign: "<<<<<", resp2: ar, resp2sign: ">>>>>", correct_response: 1, condition: 1},
	{stim: al, stimsign: "<<<<<", resp1: ml_fr, resp1sign: ">><>>", resp2: mr_fl, resp2sign: "<<><<", correct_response: 0, condition: 2},
	{stim: al, stimsign: "<<<<<", resp1: mr_fl, resp1sign: "<<><<", resp2: ml_fr, resp2sign: ">><>>", correct_response: 1, condition: 2},
	{stim: ar, stimsign: ">>>>>", resp1: ml_fr, resp1sign: ">><>>", resp2: mr_fl, resp2sign: "<<><<", correct_response: 1, condition: 2},
	{stim: ar, stimsign: ">>>>>", resp1: mr_fl, resp1sign: "<<><<", resp2: ml_fr, resp2sign: ">><>>", correct_response: 0, condition: 2},
	{stim: mr_fl, stimsign: "<<><<", resp1: al, resp1sign: "<<<<<", resp2: ar, resp2sign: ">>>>>", correct_response: 0, condition: 3},
	{stim: mr_fl, stimsign: "<<><<", resp1: ar, resp1sign: ">>>>>", resp2: al, resp2sign: "<<<<<", correct_response: 1, condition: 3},
	{stim: ml_fr, stimsign: ">><>>", resp1: al, resp1sign: "<<<<<", resp2: ar, resp2sign: ">>>>>", correct_response: 1, condition: 3},
	{stim: ml_fr, stimsign: ">><>>", resp1: ar, resp1sign: ">>>>>", resp2: al, resp2sign: "<<<<<", correct_response: 0, condition: 3},
	{stim: mr_fl, stimsign: "<<><<", resp1: mr_fl, resp1sign: "<<><<", resp2: ml_fr, resp2sign: ">><>>", correct_response: 1, condition: 4},
	{stim: mr_fl, stimsign: "<<><<", resp1: ml_fr, resp1sign: ">><>>", resp2: mr_fl, resp2sign: "<<><<", correct_response: 0, condition: 4},	
	{stim: ml_fr, stimsign: ">><>>", resp1: mr_fl, resp1sign: "<<><<", resp2: ml_fr, resp2sign: ">><>>", correct_response: 0, condition: 4},
	{stim: ml_fr, stimsign: ">><>>", resp1: ml_fr, resp1sign: ">><>>", resp2: mr_fl, resp2sign: "<<><<", correct_response: 1, condition: 4}	
]

// 2. Create fixed random order of trials for practice and main phases of task (practice_flanker, main_flanker)
var practice_flanker = jsPsych.randomization.sampleWithReplacement(items_flanker, 100);
var main_flanker = jsPsych.randomization.sampleWithReplacement(items_flanker, 500);


// 3a.1 
var instructions_flanker_1 = {
	type: jsPsychHtmlButtonResponse,
	stimulus: `<p style='font-size: 15pt; text-align: left;'>See what direction the outside arrows are pointing. From the two options below<br>
				select the one that has the middle arrow pointing in that direction. DON'T pay<br>
				attention to the direction of the top middle arrow or the outside arrow direction of<br>
				the two options below. It's important to match the top outside arrow direction with<br>
				the middle arrow direction of the options below. We will begin with a practice round.<br>
				You will have 30 seconds to earn as many points as possible.</p>
				<div style='height: 75px;'></div>
				<span style='font-size: 9pt;'>OUTSIDE ARROWS ARE POINTING LEFT</span><br>
				<img src='` + mr_fl + `' width='290'><p><br></p>
				<div><button class="choiceStyle" style="font-family: Open Sans;"><div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div><img src='` + mr_fl + `' width='290'><div style="font-size: 9pt; color: white; font-weight: normal;">WRONG ANSWER<br>(Inside arrow is right)</div></button><div class="space"></div>
				<button class="choiceStyle" style="font-family: Open Sans;"><div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div><img src='` + ml_fr + `' width='290'><div style="font-size: 9pt; color: white; font-weight: normal;">RIGHT ANSWER<br>(Inside arrow is left)</div></button></div>`,
	choices: ["Begin practice"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		data.task = "flanker";
	}
}

// 3a.2
var prepare_practice_flanker = {
	type: jsPsychHtmlButtonResponse,
	stimulus: "<div style='font-size: 10pt; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_flanker + "</b></span></div></div><div style='height: 150px;'></div>" +
				"<p style='font-size: 54pt; font-weight: 1000; color: black;'>_</p>",
	choices: ["Review instructions again", "Start practice trials"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		stay = data.response == 0 ? 1 : 0;
		data.task = "flanker";
		practice = 1;
	}
}

// 3a
var intro_flanker = {
	timeline: [instructions_flanker_1, prepare_practice_flanker],
	on_timeline_start: function() {
		stay = 1;
		timeout = 0;
	},
	loop_function: function() {
		return stay;
	},
	on_timeline_end: function() {
		stay = 1;
	}
}

// 3d.1
var instructions_flanker_2 = {
	type: jsPsychHtmlButtonResponse,
	stimulus: `<p style='font-size: 15pt; text-align: left;'>That's it for practice. Please review the instructions one last time. See what direction the<br>
				outside arrows are pointing. From the two options below select the one that has the<br>
				middle arrow pointing in that direction. DON'T pay attention to the direction of the<br>
				top middle arrow or the outside arrow direction of the two options below. It's<br>
				important to match the top outside arrow direction with the middle arrow direction of<br>
				the options below. You will have 90 seconds to earn as many points as possible.</p>
				<div style='height: 75px;'></div>
				<span style='font-size: 9pt;'>OUTSIDE ARROWS ARE POINTING LEFT</span><br>
				<img src='` + mr_fl + `' width='290'><p><br></p>
				<div><button class="choiceStyle" style="font-family: Open Sans;"><div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div><img src='` + mr_fl + `' width='290'><div style="font-size: 9pt; color: white; font-weight: normal;">WRONG ANSWER<br>(Inside arrow is right)</div></button><div class="space"></div>
				<button class="choiceStyle" style="font-family: Open Sans;"><div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div><img src='` + ml_fr + `' width='290'><div style="font-size: 9pt; color: white; font-weight: normal;">RIGHT ANSWER<br>(Inside arrow is left)</div></button></div>`,
	choices: ["I understand"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		data.task = "flanker";
	}
}

// 3d.2
var prepare_main_flanker = {
	type: jsPsychHtmlButtonResponse,
	stimulus: "<div style='font-size: 10pt; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_flanker + "</b></span></div></div><div style='height: 150px;'></div>" +
				"<p style='font-size: 54pt; font-weight: 1000; color: black;'>_</p>",
	choices: ["Review instructions again", "Start task"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		stay = data.response == 0 ? 1 : 0;
		data.task = "flanker";
		practice = 0;
		clearTimeout(end_timer);
	}
}

// 3d
var premain_flanker = {
	timeline: [instructions_flanker_2, prepare_main_flanker],
	on_timeline_start: function() {
		total_flanker = 0;
		timeout = 0;
	},
	loop_function: function() {
		return stay;
	},
	on_timeline_end: function() {
		stay = 1;
	}
}

// Function to create display stimulus + countdown bar
var display_flanker = function(stimulus) {
	var stim = stimuli_flanker[stimulus].stim;

	return "<div style='font-size: 10pt; position: relative; left: 5%; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_flanker + "</b></span></div></div><div style='height: 130px;'></div>" +
	"<img src='" + stim + "' width='290'><p><br></p>"
}


// Function to create block of flanker trials
// 		- flanker: Array containing the indices of stimuli_flanker to be referenced as nth trials for that block
var createFlankerBlock = function(flanker) {
	var trial_flanker = {
		type: jsPsychHtmlButtonResponse,
		stimulus: function() { return display_flanker(flanker[block_trial_count]); },
		choices: function() { return [stimuli_flanker[flanker[block_trial_count]].resp1, stimuli_flanker[flanker[block_trial_count]].resp2]; },
		button_html: function() {
			var choice1 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000;"><div style="color: black; font-size: 34pt; font-weight: 200;">_</div><img src=%choice% width="290"></button>'
			var choice2 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000;"><div style="color: black; font-size: 34pt; font-weight: 200;">_</div><img src=%choice% width="290"></button>'
			
			return [choice1, choice2];
		},
		margin_horizontal: '53px',
		on_start: function() {
			// Set up timer if it's the first trial
			if (block_trial_count == 0) {
				block_time_limit = practice == 1 ? practice_duration : main_duration;
				block_start = Date.now();			
	
				end_timer = setTimeout(function() {
	
					block_trial_count = 0;
					timeout = 1;
					
					// console.log("Block timed out at this trial", block_trial_count, timeout); // Here to debug
							
					// this function is all you need to end the current timeline
					jsPsych.endCurrentTimeline();
					
				}, block_time_limit);
			}		
		},
		on_load: function() {
			countdown(block_start, block_time_limit);
		},
		on_finish: function(data) {
			data.block_trial_count = timeout == 1 ? block_trial_count : block_trial_count + 1;
			data.task = "flanker";
			data.practice = practice;
			data.item = flanker[block_trial_count];
			data.stim = stimuli_flanker[flanker[block_trial_count]].stimsign;
			data.resp1 = stimuli_flanker[flanker[block_trial_count]].resp1sign;
			data.resp2 = stimuli_flanker[flanker[block_trial_count]].resp2sign;
			data.correct_response = stimuli_flanker[flanker[block_trial_count]].correct_response;
			data.condition = stimuli_flanker[flanker[block_trial_count]].condition;
			data.accuracy = data.response == stimuli_flanker[flanker[block_trial_count]].correct_response ? 1 : 0;
			data.timeout = timeout;

			switch(timeout) {
				case 0:
					total_flanker = data.accuracy == 1 ? total_flanker + 1 : total_flanker - 1;
					break;
				case 1:
					total_flanker = total_flanker;
					break;
			}

			data.score_after_trial = total_flanker;
			
			// console.log(data, block_time_limit - (Date.now()-block_start), (Date.now() - block_start)) // Here to debug
		}
	}
	
	var feedback_flanker = {
		type: jsPsychHtmlButtonResponse,
		stimulus: function() { return display_flanker(flanker[block_trial_count]); },
		choices: function() { return [stimuli_flanker[flanker[block_trial_count]].resp1, stimuli_flanker[flanker[block_trial_count]].resp2]; },
		button_html: function() {
			var resp = jsPsych.data.get().last(1).values()[0].response;
			var correct_response = jsPsych.data.get().last(1).values()[0].correct_response;
	
			switch (resp) {
				case 0:
					var feedback1 = correct_response == 0 ? '<div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>' : '<div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>';
					var feedback2 = '<div style="color: black; font-size: 34pt; font-weight: 200;">_</div>';
					break;
				case 1:
					var feedback1 = '<div style="color: black; font-size: 34pt; font-weight: 200;">_</div>';
					var feedback2 = correct_response == 1 ? '<div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>' : '<div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>';
					break;
			}
	
			var choice1 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: #0000FF;">' + feedback1 + '<img src=%choice% width="290"></button>'
			var choice2 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: #0000FF;">' + feedback2 + '<img src=%choice% width="290"></button>'
	
			return [choice1, choice2];
		},
		margin_horizontal: '53px',
		on_start: function() {
			block_trial_count++
		},
		on_load: function() {
			countdown(block_start, block_time_limit);
		},
		trial_duration: 500,
		response_ends_trial: false
	}
	
	var block_flanker = {
		timeline: [trial_flanker, feedback_flanker],
		loop_function: function() {
			return true;
		}
	}

	return block_flanker;
}

// 3c & 3f
block_flanker_practice = createFlankerBlock(practice_flanker);
block_flanker_main = createFlankerBlock(main_flanker);

// 3g
var conclusion_flanker = {
	type: jsPsychHtmlButtonResponse,
	stimulus: function() {return `<p>You earned a total of ` + total_flanker + ` points for that task. Great job!</p><p>Click on NEXT TASK to move on.</p>`; },
	choices: ["NEXT TASK"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_start: function() {
		// Calculate the following metrics separately for practice trials and main trials, filtering out the trial where the block timed out:
		//     - score_final: final score of the participant at the end of the block
		//	   - meanrt_final: mean RT of all trials across the block (regardless of accuracy)
		//     - score_x: score of the participant for x condition calculated as correct - incorrect for trials in x condition, where x is as follows:
		//			1. fully congruent
		//			2. stim congruent resp incongruent
		//			3. stim incongruent resp congruent
		//          4. fully incongruent
		//	   - meanrt_x: mean RT of all trials for x condition (regardless of accuracy)

		jsPsych.data.get().filter({task: "flanker", practice: 1}).addToAll({
			score_final: jsPsych.data.get().filter({task: "flanker", practice: 1, timeout: 0}).last(1).values()[0].score_after_trial,
			meanrt_final: jsPsych.data.get().filter({task: "flanker", practice: 1, timeout: 0}).select("rt").mean(),
			score_1: jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 1, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 1, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_1: jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 1, timeout: 0}).select("rt").mean(),
			score_2: jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 2, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 2, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_2: jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 2, timeout: 0}).select("rt").mean(),
			score_3: jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 3, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 3, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_3: jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 3, timeout: 0}).select("rt").mean(),
			score_4: jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 4, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 4, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_4: jsPsych.data.get().filter({task: "flanker", practice: 1, condition: 4, timeout: 0}).select("rt").mean()
		})

		jsPsych.data.get().filter({task: "flanker", practice: 0}).addToAll({
			score_final: jsPsych.data.get().filter({task: "flanker", practice: 0, timeout: 0}).last(1).values()[0].score_after_trial,
			meanrt_final: jsPsych.data.get().filter({task: "flanker", practice: 0, timeout: 0}).select("rt").mean(),
			score_1: jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 1, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 1, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_1: jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 1, timeout: 0}).select("rt").mean(),
			score_2: jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 2, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 2, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_2: jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 2, timeout: 0}).select("rt").mean(),
			score_3: jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 3, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 3, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_3: jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 3, timeout: 0}).select("rt").mean(),
			score_4: jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 4, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 4, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_4: jsPsych.data.get().filter({task: "flanker", practice: 0, condition: 4, timeout: 0}).select("rt").mean()
		})

		if (online == 0) {
			var filename = "data_squared-flanker_" + subject + ".csv";
			jsPsych.data.get().filter({task: "flanker"}).localSave('csv', filename);
		}
		clearTimeout(end_timer);
	}
}

// Put timeline together
var flanker_task = {timeline: [intro_flanker, threetwoone, block_flanker_practice, premain_flanker, threetwoone, block_flanker_main, conclusion_flanker]};

///////////////////////////////////////////////
///////////////// SIMON /////////////////////
///////////////////////////////////////////////

// 1. Create object that has all the possible stimuli for the task (stimuli_simon)
// 2. Create fixed random order of trials for practice and main phases of task (practice_simon, main_simon)
// 3. Create timeline objects
//		a. intro_simon timeline
//			a1. instructions_simon_1
//      	a2. prepare_practice_simon
//      b. threetwoone countdown
//		c. block_simon_practice -> practice trials
//      d. premain_simon timeline
//			d1. instructions_simon_2
//			d2. prepare_main_simon
//		e. threetwoone countdown
//		f. block_main_simon -> main task
//		g. conclusion_simon -> reports final score to participant

const rarr = "rarr.PNG";
const larr = "larr.PNG";

// 1. Create object that has all the possible stimuli for the task (stimuli_simon)
var stimuli_simon = [
	{stim: larr, stimsign: "<", loc: "left", resp1: "LEFT", resp2: "RIGHT", correct_response: 0, condition: 1},
	{stim: rarr, stimsign: ">", loc: "right", resp1: "LEFT", resp2: "RIGHT", correct_response: 1, condition: 1},
	{stim: larr, stimsign: "<", loc: "left", resp1: "RIGHT", resp2: "LEFT", correct_response: 1, condition: 2},
	{stim: rarr, stimsign: ">", loc: "right", resp1: "RIGHT", resp2: "LEFT", correct_response: 0, condition: 2},
	{stim: larr, stimsign: "<", loc: "right", resp1: "LEFT", resp2: "RIGHT", correct_response: 0, condition: 3},
	{stim: rarr, stimsign: ">", loc: "left", resp1: "LEFT", resp2: "RIGHT", correct_response: 1, condition: 3},
	{stim: larr, stimsign: "<", loc: "right", resp1: "RIGHT", resp2: "LEFT", correct_response: 1, condition: 4},
	{stim: rarr, stimsign: ">", loc: "left", resp1: "RIGHT", resp2: "LEFT", correct_response: 0, condition: 4}
]

// 2. Create fixed random order of trials for practice and main phases of task (practice_simon, main_simon)
var practice_simon = jsPsych.randomization.sampleWithReplacement(items_simon, 100);
var main_simon = jsPsych.randomization.sampleWithReplacement(items_simon, 500);

// 3a.1 
var instructions_simon_1 = {
	type: jsPsychHtmlButtonResponse,
	stimulus: `<p style='font-size: 15pt; text-align: left;'>Arrows will appear below, on the right or the left. You must click the response option that<br>
				says which direction the arrow is pointing. We will begin with a practice round. You<br>
				will have 30 seconds to earn as many points as possible.</p>
				<div style='height: 100px;'></div>
				<span style='font-size: 9pt; text-align: left;'>ARROW IS POINTING LEFT</span><br>
				<span style='display: flex; justify-content: left;'><img src='` + larr + `' height='70'></span><p></p>
				<div style='height: 50px;'></div>
				<div><button class="choiceStyle" style="font-family: Open SANS; color: white; font-weight: 1000;"><div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>RIGHT<div style="font-size: 9pt; color: white; font-weight: normal;">WRONG ANSWER<br>(Meaning doesn't match direction of arrow)</div></button><div class="space"></div>
				<button class="choiceStyle" style="font-family: Open Sans; color: white; font-weight: 1000;"><div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>LEFT<div style="font-size: 9pt; color: white; font-weight: normal;">RIGHT ANSWER<br>(Meaning matches direction of arrow)</div></button></div>`,
	choices: ["Begin practice"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		data.task = "simon";
	}
}

// 3a.2
var prepare_practice_simon = {
	type: jsPsychHtmlButtonResponse,
	stimulus: "<div style='font-size: 10pt; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_simon + "</b></span></div></div><div style='height: 150px;'></div>" +
				"<p style='font-size: 54pt; font-weight: 1000; color: black;'>_</p>",
	choices: ["Review instructions again", "Start practice trials"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		stay = data.response == 0 ? 1 : 0;
		data.task = "simon";
		practice = 1;
	}
}

// 3a
var intro_simon = {
	timeline: [instructions_simon_1, prepare_practice_simon],
	on_timeline_start: function() {
		stay = 1;
		timeout = 0;
	},
	loop_function: function() {
		return stay;
	},
	on_timeline_end: function() {
		stay = 1;
	}
}

// 3d.1
var instructions_simon_2 = {
	type: jsPsychHtmlButtonResponse,
	stimulus: `<p style='font-size: 15pt; text-align: left;'>That's it for practice. Please review the instructions one last time. Arrows will appear<br>
				below on the right or the left. You must click the response option that says which<br>
				direction the arrow is pointing. You have 90 seconds to earn as many points as<br>
				possible.</p>
				<div style='height: 75px;'></div>
				<span style='font-size: 9pt; text-align: left;'>ARROW IS POINTING LEFT</span><br>
				<span style='display: flex; justify-content: left;'><img src='` + larr + `' height='70'></span><p></p>
				<div style='height: 50px;'></div>
				<div><button class="choiceStyle" style="font-family: Open SANS; color: white; font-weight: 1000;"><div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>RIGHT<div style="font-size: 9pt; color: white; font-weight: normal;">WRONG ANSWER<br>(Meaning doesn't match direction of arrow)</div></button><div class="space"></div>
				<button class="choiceStyle" style="font-family: Open Sans; color: white; font-weight: 1000;"><div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>LEFT<div style="font-size: 9pt; color: white; font-weight: normal;">RIGHT ANSWER<br>(Meaning matches direction of arrow)</div></button></div>`,
	choices: ["I understand"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		data.task = "simon";
	}
}

// 3d.2
var prepare_main_simon = {
	type: jsPsychHtmlButtonResponse,
	stimulus: "<div style='font-size: 10pt; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_simon + "</b></span></div></div><div style='height: 150px;'></div>" +
				"<p style='font-size: 54pt; font-weight: 1000; color: black;'>_</p>",
	choices: ["Review instructions again", "Start task"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_finish: function(data) {
		stay = data.response == 0 ? 1 : 0;
		data.task = "simon";
		practice = 0;
		clearTimeout(end_timer);
	}
}

// 3d
var premain_simon = {
	timeline: [instructions_simon_2, prepare_main_simon],
	on_timeline_start: function() {
		total_simon = 0;
		timeout = 0;
	},
	loop_function: function() {
		return stay;
	},
	on_timeline_end: function() {
		stay = 1;
	}
}

// Function to create display stimulus + countdown bar
var display_simon = function(stimulus) {
	var stim = stimuli_simon[stimulus].stim;
	var loc = stimuli_simon[stimulus].loc;

	return "<div style='font-size: 10pt; position: relative; left: 5%; display: flex; align-items: center;'>Time left<div id = 'countdownbar' style = 'margin: 0px 25px;'><div id = 'timeleft'></div></div><div style='align-self: baseline;'>Score<br><span style='font-size:27pt;'><b>" + total_simon + "</b></span></div></div><div style='height: 128px;'></div>" +
	"<span style='display: flex; justify-content: " + loc + ";'><img src='" + stim + "' height='70'></span><p></p>" +
	"<div style='height: 50px;'></div>"
}

// Function to create block of simon trials
// 		- simon: Array containing the indices of stimuli_simon to be referenced as nth trials for that block
var createSimonBlock = function(simon) {
	var trial_simon = {
		type: jsPsychHtmlButtonResponse,
		stimulus: function() { return display_simon(simon[block_trial_count]); },
		choices: function() { return [stimuli_simon[simon[block_trial_count]].resp1, stimuli_simon[simon[block_trial_count]].resp2]; },
		button_html: function() {
			var choice1 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: white;"><div style="color: black; font-size: 34pt; font-weight: 200;">_</div>%choice%</button>'
			var choice2 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: white;"><div style="color: black; font-size: 34pt; font-weight: 200;">_</div>%choice%</button>'
			
			return [choice1, choice2];
		},
		margin_horizontal: '53px',
		on_start: function() {
			// Set up timer if it's the first trial
			if (block_trial_count == 0) {
				block_time_limit = practice == 1 ? practice_duration : main_duration;
				block_start = Date.now();			
	
				end_timer = setTimeout(function() {
	
					block_trial_count = 0;
					timeout = 1;
					
					// console.log("Block timed out at this trial", block_trial_count, timeout); // Here to debug
							
					// this function is all you need to end the current timeline
					jsPsych.endCurrentTimeline();
					
				}, block_time_limit);
			}		
		},
		on_load: function() {
			countdown(block_start, block_time_limit);
		},
		on_finish: function(data) {
			data.block_trial_count = timeout == 1 ? block_trial_count : block_trial_count + 1;
			data.task = "simon";
			data.practice = practice;
			data.item = simon[block_trial_count];
			data.stim = stimuli_simon[simon[block_trial_count]].stimsign;
			data.location = stimuli_simon[simon[block_trial_count]].loc;
			data.resp1 = stimuli_simon[simon[block_trial_count]].resp1;
			data.resp2 = stimuli_simon[simon[block_trial_count]].resp2;
			data.correct_response = stimuli_simon[simon[block_trial_count]].correct_response;
			data.condition = stimuli_simon[simon[block_trial_count]].condition;
			data.accuracy = data.response == stimuli_simon[simon[block_trial_count]].correct_response ? 1 : 0;
			data.timeout = timeout;

			switch(timeout) {
				case 0:
					total_simon = data.accuracy == 1 ? total_simon + 1 : total_simon - 1;
					break;
				case 1:
					total_simon = total_simon;
					break;
			}

			data.score_after_trial = total_simon;
			
			// console.log(data, block_time_limit - (Date.now()-block_start), (Date.now() - block_start)) // Here to debug
		}
	}
	
	var feedback_simon = {
		type: jsPsychHtmlButtonResponse,
		stimulus: function() { return display_simon(simon[block_trial_count]); },
		choices: function() { return [stimuli_simon[simon[block_trial_count]].resp1, stimuli_simon[simon[block_trial_count]].resp2]; },
		button_html: function() {
			var resp = jsPsych.data.get().last(1).values()[0].response;
			var correct_response = jsPsych.data.get().last(1).values()[0].correct_response;
	
			switch (resp) {
				case 0:
					var feedback1 = correct_response == 0 ? '<div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>' : '<div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>';
					var feedback2 = '<div style="color: black; font-size: 34pt; font-weight: 200;">_</div>';
					break;
				case 1:
					var feedback1 = '<div style="color: black; font-size: 34pt; font-weight: 200;">_</div>';
					var feedback2 = correct_response == 1 ? '<div style="color: #1ED760; font-size: 34pt; font-weight: 200;">&#10004;</div>' : '<div style="color: red; font-size: 34pt; font-weight: 200;">&#10008;</div>';
					break;
			}
	
			var choice1 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: white;">' + feedback1 + '%choice%</button>'
			var choice2 = '<button class="choiceStyle" style="font-family: Open Sans; font-weight: 1000; color: white;">' + feedback2 + '%choice%</button>'
	
			return [choice1, choice2];
		},
		margin_horizontal: '53px',
		on_start: function() {
			block_trial_count++
		},
		on_load: function() {
			countdown(block_start, block_time_limit);
			
		},
		trial_duration: 500,
		response_ends_trial: false
	}
	
	var block_simon = {
		timeline: [trial_simon, feedback_simon],
		loop_function: function() {
			return true;
		}
	}

	return block_simon;
}

// 3c & 3f
block_simon_practice = createSimonBlock(practice_simon);
block_simon_main = createSimonBlock(main_simon);

// 3g
var conclusion_simon = {
	type: jsPsychHtmlButtonResponse,
	stimulus: function() {return `<p>You earned a total of ` + total_simon + ` points for that task. Great job!</p><p>Click on NEXT to see all your scores.</p>`; },
	choices: ["NEXT"],
	button_html: `<div style='height: 70px;'></div><button class="defaultButton">%choice%</button>`,
	on_start: function() {
		// Calculate the following metrics separately for practice trials and main trials, filtering out the trial where the block timed out:
		//     - score_final: final score of the participant at the end of the block
		//	   - meanrt_final: mean RT of all trials across the block (regardless of accuracy)
		//     - score_x: score of the participant for x condition calculated as correct - incorrect for trials in x condition, where x is as follows:
		//			1. fully congruent
		//			2. stim congruent resp incongruent
		//			3. stim incongruent resp congruent
		//          4. fully incongruent
		//	   - meanrt_x: mean RT of all trials for x condition (regardless of accuracy)

		jsPsych.data.get().filter({task: "simon", practice: 1}).addToAll({
			score_final: jsPsych.data.get().filter({task: "simon", practice: 1, timeout: 0}).last(1).values()[0].score_after_trial,
			meanrt_final: jsPsych.data.get().filter({task: "simon", practice: 1, timeout: 0}).select("rt").mean(),
			score_1: jsPsych.data.get().filter({task: "simon", practice: 1, condition: 1, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "simon", practice: 1, condition: 1, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_1: jsPsych.data.get().filter({task: "simon", practice: 1, condition: 1, timeout: 0}).select("rt").mean(),
			score_2: jsPsych.data.get().filter({task: "simon", practice: 1, condition: 2, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "simon", practice: 1, condition: 2, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_2: jsPsych.data.get().filter({task: "simon", practice: 1, condition: 2, timeout: 0}).select("rt").mean(),
			score_3: jsPsych.data.get().filter({task: "simon", practice: 1, condition: 3, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "simon", practice: 1, condition: 3, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_3: jsPsych.data.get().filter({task: "simon", practice: 1, condition: 3, timeout: 0}).select("rt").mean(),
			score_4: jsPsych.data.get().filter({task: "simon", practice: 1, condition: 4, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "simon", practice: 1, condition: 4, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_4: jsPsych.data.get().filter({task: "simon", practice: 1, condition: 4, timeout: 0}).select("rt").mean()
		})

		jsPsych.data.get().filter({task: "simon", practice: 0}).addToAll({
			score_final: jsPsych.data.get().filter({task: "simon", practice: 0, timeout: 0}).last(1).values()[0].score_after_trial,
			meanrt_final: jsPsych.data.get().filter({task: "simon", practice: 0, timeout: 0}).select("rt").mean(),
			score_1: jsPsych.data.get().filter({task: "simon", practice: 0, condition: 1, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "simon", practice: 0, condition: 1, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_1: jsPsych.data.get().filter({task: "simon", practice: 0, condition: 1, timeout: 0}).select("rt").mean(),
			score_2: jsPsych.data.get().filter({task: "simon", practice: 0, condition: 2, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "simon", practice: 0, condition: 2, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_2: jsPsych.data.get().filter({task: "simon", practice: 0, condition: 2, timeout: 0}).select("rt").mean(),
			score_3: jsPsych.data.get().filter({task: "simon", practice: 0, condition: 3, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "simon", practice: 0, condition: 3, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_3: jsPsych.data.get().filter({task: "simon", practice: 0, condition: 3, timeout: 0}).select("rt").mean(),
			score_4: jsPsych.data.get().filter({task: "simon", practice: 0, condition: 4, accuracy: 1, timeout: 0}).select("accuracy").count() - jsPsych.data.get().filter({task: "simon", practice: 0, condition: 4, accuracy: 0, timeout: 0}).select("accuracy").count(),
			meanrt_4: jsPsych.data.get().filter({task: "simon", practice: 0, condition: 4, timeout: 0}).select("rt").mean()
		})

		if (online == 0) {
			var filename = "data_squared-simon_" + subject + ".csv";
			jsPsych.data.get().filter({task: "simon"}).localSave('csv', filename);
		}
		clearTimeout(end_timer);
	}
}

// Put timeline together
var simon_task = {timeline: [intro_simon, threetwoone, block_simon_practice, premain_simon, threetwoone, block_simon_main, conclusion_simon]};

/////////////////////////////////////////
// FINALIZE EXPERIMENT CONTEXT  /////////
/////////////////////////////////////////

// Ending screen
var conclusion = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: function() { return '<p style="font-size:25px;"> You earned the following points in the three tasks: <br>' +
	          '<p> Colors Task: ' + total_stroop + ' points</p>' +
			  '<p> Multiple Arrows Task: ' + total_flanker + ' points</p>' +
			  '<p> Single Arrow Task: ' + total_simon + ' points</p>' +
			  '<p style="font-size:25px;">You are now finished with this set of tasks.</p>' +
              '<p style="font-size:25px;"><b> Press any key to exit.</b></p>' }
}

var exit_fullscreen = {
	type: jsPsychFullscreen,
	fullscreen_mode: false,
	delay_after: 0,
	on_finish: function(){jsPsych.endExperiment();}
  }


// PUTTING IT ALL TOGETHER
var preload = {
	type: jsPsychPreload,
	images: [al, ar, ml_fr, mr_fl, rarr, larr]
}

timeline.push(preload, get_participant_id, get_location, welcome, enter_fullscreen, stroop_task, flanker_task, simon_task, conclusion, exit_fullscreen);
jsPsych.run(timeline);