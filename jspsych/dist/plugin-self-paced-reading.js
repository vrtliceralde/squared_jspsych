var jsPsychSelfPacedReading = function(e) 
    {
        "use strict";
        const t = {
            name: "self-paced-reading",
            parameters: {
                sentence: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Sentence",
                    default: void 0
                },
                font_family: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Font family", 
                    default: "monospace"
                },
                font_size: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Font size",
                    default: "24px"
                },
                font_weight: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Font weight",
                    default: "normal"
                },
                font_colour: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Font colour",
                    default: "black"
                },
                mask_type: {
                    type: e.ParameterType.INT,
                    pretty_name: "Mask type",
                    default: 1
                },
                mask_character: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Mask character",
                    default: "_"
                },
                mask_on_word: {
                    type: e.ParameterType.BOOL,
                    pretty_name: "Mask word",
                    default: !0
                },
                mask_gap_character: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Mask gap character.",
                    default: " "
                },
                mask_offset: {
                    type: e.ParameterType.INT,
                    pretty_name: "Mask offset",
                    default: 0
                },
                mask_weight: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Mask weight",
                    default: "normal"
                },
                mask_colour: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Mask colour",
                    default: "black"
                },
                trial_duration: { // Added by VL
                    type: e.ParameterType.INT,
                    pretty_name: "Trial duration",
                    default: null,
                },
                line_height: {
                    type: e.ParameterType.INT,
                    pretty_name: "Line height",
                    default: 80
                },
                canvas_colour: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Canvas colour",
                    default: "white"
                },
                canvas_size: {
                    type: e.ParameterType.INT,
                    array: !0,
                    pretty_name: "Canvas size",
                    default: [1280,960]
                },
                canvas_border: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Canvas border",
                    default: "0px solid black"
                },
                canvas_clear_border: {
                    type: e.ParameterType.BOOL,
                    pretty_name: "Clear canvas border",
                    default: !1
                },
                translate_origin: {
                    type: e.ParameterType.BOOL,
                    pretty_name: "Translate origin",
                    default: !1 // VL: Changed to !1 from !0 to be consistent with default on Github documentation: https://github.com/igmmgi/jspsych-contrib/blob/self-paced-reading/packages/plugin-self-paced-reading/docs/jspsych-self-paced-reading.md
                },
                choices: {
                    type: e.ParameterType.KEYS,
                    pretty_name: "Keys",
                    default: [" "]
                },
                xy_position: {
                    type: e.ParameterType.INT,
                    array: !0,
                    pretty_name: "XY position",
                    default: [0,0]
                },
                x_align: {
                    type: e.ParameterType.STRING,
                    pretty_name: "X alignment",
                    default: "center"
                },
                y_align: {
                    type: e.ParameterType.STRING,
                    pretty_name: "Y alignment",
                    default: "top"
                },
                inter_word_interval: {
                    type: e.ParameterType.INT,
                    pretty_name: "inter-word-interval",
                    default: 0
                },
                save_sentence: {
                    type: e.ParameterType.BOOL,
                    pretty_name: "Save sentence",
                    default: !0}
                }
            };
        
        function a(e,t) {
            return t.repeat(e.length)
        }
        
        let n = {1:(e,t)=>e!==t,2:(e,t)=>e>t};
        
        class r {
            constructor(e) {
                this.jsPsych = e
            }
            
            trial(e,t) {
                e.innerHTML = '<div><canvas id="canvas" width="'+t.canvas_size[0]+'" height="'+t.canvas_size[1]+'" style="border: '+t.canvas_border+';"></canvas></div>';
                let r = document.getElementById("canvas"),
                    l = r.getContext("2d"),
                    s = function(e,t,a,n) {
                        let r;
                        return n?(t.translate(e.width/2,e.height/2), r = [-e.width/2,-e.height/2,e.width,e.height]):r = [0,0,e.width,e.height],
                        t.fillStyle = a,
                        t.fillRect(r[0],r[1],r[2],r[3]),
                        r
                }
                
                (r,l,t.canvas_colour,t.translate_origin);
                l.textAlign = t.x_align, l.textBaseline="middle";
                
                let i, o = [], p = [], y = 0, _ = -1 , c = -1, m = 0,
                    f = t.sentence.replace(/(\r\n|\n|\r)/gm,""),
                    h = f.split(" "),
                    d = t.font_weight+" "+t.font_size+" "+t.font_family,
                    u = t.mask_weight+" "+t.font_size+" "+t.font_family,
                    g = [0],
                    T = 3 !== t.mask_type?t.mask_character:t.mask_character.repeat(h[0].length);
                    
                    if (3 !== t.mask_type) {
                        i = t.sentence.split("\n").map((e=>e.trim()));
                        for (let e=0;e<i.length;e++)
                            o[e] = i[e].split(" "),
                            y += o[e].length,p.push(o[e].length);
                            o.length > 1 &&"center" === t.y_align && (t.xy_position[1] -= .5*o.length*t.line_height)
                    }
                    
                    else o = t.sentence.split(" "), y = o.length;
                        
                    const P = (k = t.mask_type, (e,t)=>e.map(((e,r)=>n[k](r,t)?a(e," "):e)).join(" "));
                    var k;
                    const v = function(e,t,r,l) {
                        return(s,i) => s.map(((l,s) => n[e](s,i)?a(l,r):a(l,t?r:" "))).join(l)
                    }
                    (t.mask_type,t.mask_on_word,T,t.mask_gap_character);
                        
                    function w(){ 
                        if (l.font = u, l.fillStyle = t.mask_colour, 3 !== t.mask_type)
                            for (let e=0;e<o.length;e++) {
                                let a=e===m?c:-1;l.fillText(v(o[e],a),
                                t.xy_position[0],
                                t.xy_position[1]+e*t.line_height+t.mask_offset)
                            }
                            else 3 === t.mask_type && -1 === _ && l.fillText(T,t.xy_position[0], t.xy_position[1]+t.mask_offset)
                        }
                        
                    function x() {
                        if (l.font = d, l.fillStyle = t.font_colour, 3 !== t.mask_type) {
                            for (let e=0;e<m;e++)
                                l.fillText(P(o[e],o[e].length), t.xy_position[0], t.xy_position[1]+e*t.line_height);
                                l.fillText(P(o[m],c), t.xy_position[0], t.xy_position[1]+m*t.line_height)
                            }
                            
                            else 3 === t.mask_type && _ > -1 && l.fillText(o[_], t.xy_position[0], t.xy_position[1]);
                            c+1 < p[m]?c++:m<o.length-1&&(m++,c=0)
                        }
                        
                    let I = {
                        rt_sentence: null,
                        rt_word: null,
                        word: null,
                        word_number: null,
                        key: null, // Added by VL to record key
                        sentence: null,
                    };
                    
                    w(), x();
                    
                    const S = () => {
                        t.canvas_clear_border?e.innerHTML=" ":(l.fillStyle=t.canvas_colour,l.fillRect(s[0],s[1],s[2],s[3])),
                        this.jsPsych.pluginAPI.clearAllTimeouts(),
                        this.jsPsych.pluginAPI.cancelKeyboardResponse(N),
                        this.jsPsych.finishTrial(I)
                    };
                    
                    let N = this.jsPsych.pluginAPI.getKeyboardResponse({
                        callback_function: e => {
                            I.key = e.key, // Added by VL e.key
                            // response_word.push(e.key) // Added by VL
                            I.rt_sentence = e.rt,
                            g.push(e.rt),
                            I.rt_word = 0 ===_?g[g.length-1]-g[g.length-2]:g[g.length-1]-g[g.length-2]-t.inter_word_interval,
                            I.rt_word > 0?(I.word=h[_],I.word_number=_+1,t.save_sentence&&(I.sentence=f),_<y-1&&this.jsPsych.data.write(I),_++,
                            this.jsPsych.pluginAPI.setTimeout((function() {
                                _<y?(l.fillStyle=t.canvas_colour,l.font=t.canvas_colour,l.fillRect(s[0],s[1],s[2],s[3]),w(),x()):S()
                            }),
                            t.inter_word_interval)):g.pop()
                            },
                            
                            valid_responses: t.choices,
                            rt_method: "performance",
                            persist: !0,
                            allow_held_key: !1
                        })

                    // Added by VL: ported from html-keyboard-response    
                    // function to end trial when it is time
                    const end_trial = () => {
                        // kill any remaining setTimeout handlers
                        this.jsPsych.pluginAPI.clearAllTimeouts();
                        // kill keyboard listeners
                        if (typeof N !== "undefined") {
                            this.jsPsych.pluginAPI.cancelKeyboardResponse(N);
                        }
                        // clear the display
                        e.innerHTML = "";
                        // move on to the next trial
                        this.jsPsych.finishTrial({rt_sentence: t.trial_duration});
                    };

                    // end trial if trial_duration is set
                    if (e.trial_duration !== null) {
                        this.jsPsych.pluginAPI.setTimeout(end_trial, t.trial_duration);
                    }
                    }
                }
                
                return r.info = t, r
            }
            
            (jsPsychModule);
//# sourceMappingURL=index.browser.min.js.map