# Squared tasks of attention control for jsPsych

For questions about this specific implementation, please email Van at vrtliceralde at gmail.

For questions about the task in general, please refer to the original [Burgoyne et al. (2023)](https://doi.org/10.1037/xge0001408) paper or reach out to Alex Burgoyne directly.

When using this task, please cite Burgoyne et al. (2023) and this version of the task as follows:

Liceralde, V. R. T. & Burgoyne, A. P. (2023). Squared tasks of attention control for jsPsych (Version 1.0.0) [Computer software]. https://doi.org/10.5281/zenodo.8313315

```
@misc{liceralde23squared,
  author = {Van Rynald T. Liceralde and Alexander P. Burgoyne},
  year = {2023},
  title = {Squared tasks of attention control for {jsPsych}},
  howpublished = {\url{https://zenodo.org/badge/latestdoi/686735951}}
}
```

## Description 

This is a [jsPsych](https://www.jspsych.org/7.3/) implementation of the Squared tasks of executive attention that were developed by [Burgoyne et al. (2023)](https://doi.org/10.1037/xge0001408) ([Engle Lab Website](https://englelab.gatech.edu/attentioncontroltasks); [OSF](https://osf.io/7q598/)).

There are two directories: `squared` and `jspsych`. The `squared` directory is the main directory, and it houses the html executable file to be used to run the Squared tasks (i.e., `squared.html`). The `jspsych` directory (v7.3.1) contains all the plugins that are locally referenced in the
`squared/squared.html` file; these plugins are necessary for the program to work. If the user wants the reference to the plugins to be online instead of local, the user can modify the html file to reference the CDN-hosted scripts online (see documentation on jsPsych website). The advantage of referencing the plugins online is that the user will only need to keep the `squared` directory to run the program successfully; the disadvantage is that the program may not run if the servers are down. To be safer, local reference to the jsPsych plugins is implemented here.

## Content

The contents of the `jspsych` directory can be directly obtained [here](https://www.github.com/jspsych/jspsych/releases/latest/download/jspsych.zip).

The contents of `squared` directory are as follows:

| File | Description |
| ---- | ----------- |
| `squared.html` | The main executable file. Could be opened using any web browser. |
| `squared.js`   | The main jsPsych script. Contains the implementation of the tasks, and this file is called in `squared.html` |
| `squared.css`	 | CSS script containing formatting options to keep interface as similar to the original Burgoyne et al. programs |
| `*.png`        | Image files for Flanker and Simon tasks that are called in `squared.js` |

## How to run

The user has the option to run the program locally or through an online experiment hosting site (e.g., cognition.run, gorilla.sc).

At start-up (after collecting participant ID), the user will be prompted on whether the program is being run online or locally. If `local` is selected, the participant's data will be saved and downloaded into the local console. If `online` is selected, the hosting site will keep the data. If the program is run online and local is selected, the program will save the data and downloaded into the remote participant's console (which is not ideal).

***If the program is run locally, but `online` is selected, data will NOT be saved.***

You can implement a default of running the task online by commenting out the `get_location` object in `squared.js`.

### Local

If the user decides to collect data locally (e.g., lab computer; where the data is saved to the computer that runs the task), copying the entire `squared_jspsych` folder somewhere in the local computer and opening the `squared.html` file using any web browser should suffice. There is no installation process required other than downloading this folder/repository. Bookmarking the location of the `squared.html` file on your favorite web browser is recommended for easy access.

### Online (cognition.run, gorilla.sc)

If the user decides to collect data using an experiment hosting site, the user will need to:

1. Copy and paste the entire contents of the `squared.js` file onto the main script window
2. Upload all relevant companion files for the hosting site (e.g., the `squared.css`, all `*.png` files, and relevant plugin files from the `jspsych` directory if needed)
3. Make sure that the hosting site calls on both the main `.js` script in the main window and the companion files correctly
	
[Gorilla.sc](https://gorilla.sc) requires further ad hoc modifications to their default settings for the uploaded components to work, and it looks like they're sundowning the "Code Editor" functionality (on which this version is implememented) into a "Legacy" object, so if you're finding difficulties making the necessary modifications for Gorilla, please email Van to send you a Gorilla clone of the tasks.

## Randomizing trial order / Keeping trial order constant

Trials are randomized in the Engle Lab program (based on a version downloaded on 2023-02-01), so the default setting here is also to randomize trials across runs. However, the user may be interested in keeping the trial order constant to reduce variability in performance that's not due to individual differences in attention control (e.g., variaiblity from trial order). In this case, the user can uncomment the `jsPsych.randomization.setSeed('squaredtasks');` line to set the seed for randomization and keep one random trial order constant across runs of this program.

## Output

After doing each task, the program outputs task-specific `.csv` files (i.e., one each for Stroop, Flanker, and Simon) that contain trial-level information about the participant's responses. If run online, the output will all be combined into one `.csv` file.

All `.csv` files contain the following variables:

| Variable | Type | Description |
| -------- | ---- | ----------- |
| `rt`	| 		numeric | response time for each trial |
| `stimulus`	|		string | html-formatted stimulus that is drawn on participant's screen |
| `response`	|		numeric | indicator for which of the two buttons/choices the participant clicked on; `0`: left-hand choice, `1`: right-hand choice |
| `trial_type`	|		string | jsPsych plugin shown on the screen |
| `trial_index`	|		numeric | cumulative count of each plugin change shown to the participant |
| `time_elapsed`	|		numeric | system-recorded timestamp at the trial |
| `internal_node_id`	|	string | jsPsych-specific marker of the location of the current trial in the experiment sequence |
| `participant_id`	|		string | unique identifier for participant, collected at start-up |
| `task`	|			string | one of the three squared tasks; `stroop`, `flanker`, `simon` |
| `block_trial_count`	|	numeric | cumulative trial count within the practice and main blocks; `0`: the task timed out at that trial refer to this variable for what counts as a "trial" in the task |
| `practice`	|		numeric | indicator for whether the trial was seen in the practice block; `0`: main block, `1`: practice block |
| `item`	|		numeric | identifier for the type of trial shown to the participant |
| `stim`	|			string | the string prompt shown to the participant |
| `resp1`	|			string | the string choice presented in the left-hand button |
| `resp2`	|			string | the string choice presented in the right-hand button |
| `correct_response`	|	numeric | indicator of whether the left-hand or right-hand button is the correct-response for the trial; `0`: left-hand choice, `1`: right-hand choice |
| `condition`	|		numeric | indicator of the type/condition of the trial; `1`: `FullyCongruent`, `2`: `StimCongruentRespIncongruent`, `3`: `StimIncongruentRespCongruent`, `4`: `FullyIncongruent` (see `Squared Attention Control Task Trial Types.xls` from Burgoyne et al.) |
| `accuracy`	|		numeric | indicator for whether the participant made the correct response for the trial; `0`: incorrect, `1`: correct
| `timeout`		|		numeric | indicator for whether the block timed out for that trial, if so, accuracy for that trial is *not* counted towards final score; `0`: block is ongoing, `1`: time for block ended during this trial |
| `score_after_trial`	|	numeric | cumulative score of participant. Following Burgoyne et al., participants get a point for each correct response and lose a point for each incorrect response. The participant's final score for the task is the `score_after_trial` value on the very last row |

The following variables are included in the output of the Squared tasks from the Engle Lab website and are thus also included in all the `.csv` files:

| Variable | Type | Description |
| -------- | ---- | ----------- |
| `score_final`	|		numeric | final score of the participant at the end of the main block |
| `meanrt_final`	|		numeric | mean RT of all the trials in the main block |
| `score_x`	|			numeric | score of the participant for condition `x` calculated as `correct` $-$ `incorrect` for trials in condition `x`, where `x` is: one of the following: `1`: `FullyCongruent`; `2`: `StimCongruentRespIncongruent`; `3`: `StimIncongruent`; `4`: `FullyIncongruent` |
| `meanrt_x`	|		numeric | mean RT of all trials for condition `x` (regardless of accuracy) |

### Task-specific variables

#### Stroop

| Variable | Type | Description |
| -------- | ---- | ----------- |
| `stimcolor`	|		string | the color that the prompt string is shown in; `blue`, `red` |
| `resp1color`	|		string | the color that the string in the left-hand button is shown in; `blue`, `red` |
| `resp2color`	|		string | the color that the string in the right-hand button is shown in; `blue`, `red` |

#### Flanker

| Variable | Type | Description |
| -------- | ---- | ----------- |
| `stimsign` |		string | the symbol/text version of the arrow set image shown as the prompt; e.g., `<<<<<` |
| `resp1sign`	|		string | the symbol/text version of the arrow set image in the left-hand button; e.g., `<<<<<` |
| `resp2sign`	|		string | the symbol/text version of the arrow set image in the right-hand button; e.g., `<<<<<` |

#### Simon

| Variable | Type | Description |
| -------- | ---- | ----------- |
| `location` |			string | the location on the screen where the arrow is shown; `left`, `right` |

## FAQs

1. ***The task is still accepting responses even if the time has run out. Why is that happening? Is that a problem?***

    This is due to the how the `endCurrentTimeline()` function in jsPsych works: when the current timeline is ended, the program also waits for the current trial to end before moving on to the next timeline. So hypothetically, a new trial can appear at 29.9 sec of the 30-sec practice block (i.e., just as the block is supposed to time out), and the program would wait for a response before moving on the next part of the program, making the practice block technically last for more than 30 sec. Apparently, in jsPsych v7.3.1, that's just how it is (or we haven't gotten a solution).

    To work around this glitch, we had implemented for the `timeout` variable to be updated from 0 to 1 when the time limit is hit, so that even when a response is technically accepted after the time limit, the associated `timeout` value for that "last" trial is 1 and these trials can filtered out before any analysis. Moreover, these timeout trials have been marked with a `block_trial_count` of 0 to further distinguish them from valid trials. Note that the final value of the `score_after_trial` variable is based on the final valid trial---it is not changed at the timeout trial, so you can take the final value as the participant's actual score for the task. All of the `score_x` and `meanrt_x` variables are also only based on the valid trials.

   Long story short, this shouldn't be a problem.

2. ***The output has blank rows every after response. What are those blank rows for?***

   The online implementations of the task record every single event that happens to the screen or internally. Those blank rows represent when feedback is shown to the participant (correct or incorrect) and thus no response is collected, leaving many of the variables blank. Those blank rows can be easily filtered out.
