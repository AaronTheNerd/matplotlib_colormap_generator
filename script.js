let name_input;
let bins_input;
let output;
let colormap;
let copy_btn;
let cmap_name;
let channel_points;
let channel_segments;
let bins;
let red_channel =	[255,	100,	255,	0,		0,		0,		255,	255,	255];
let green_channel =	[0,		0,		0,		0,		0,		0,		0,		0,		255];
let blue_channel =  [0,		0,		0,		0,		255,	255,	0,		0,		255];
let alpha_channel = [0,		255,	255,	255,	255,	255,	255,	255,	255];
let red_class;
let green_class;
let blue_class;
let alpha_class;


function set_segments(val) {
	channel_segments = val;
	channel_points = channel_segments + 1;
}


function round_to_n(val, n) {
    val = Math.round(val + "e" + n);
    return Number(val + "e" + -n);
}


class Channel {
    constructor(channel, canvas, color) {
        this.channel = channel;
        this.canvas = canvas;
        this.scale_canvas();
        this.color = color;
        this.is_dragging = false;
        this.mouse_down = false;
        this.curr_index = -1;
    }
    get channel_vals() {
        return this.channel;
    }
    channelAt(index, value) {
        this.channel[index] = value;
    }
    get isDragging() {
        return this.is_dragging;
    }
    set isDragging(is_dragging) {
        this.is_dragging = is_dragging;
    }
    get mouseDown() {
        return this.mouse_down;
    }
    set mouseDown(mouse_down) {
        this.mouse_down = mouse_down;
    }
    get currIndex() {
        return this.curr_index;
    }
    set currIndex(index) {
        this.curr_index = index;
    }
    scale_canvas() {
        this.canvas.width = this.canvas.offsetWidth;
	    this.canvas.height = this.canvas.offsetHeight;
    }
    draw() {
        let ctx = this.canvas.getContext("2d");
    	ctx.fillStyle = "#FFF";
	    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    	const point_diff = this.canvas.width / channel_segments;
	    for (var i = 0; i < channel_points; ++i) {
		    ctx.beginPath();
		    ctx.fillStyle = this.color;
		    ctx.arc(
			    i * point_diff,
			    lerp(0, 255, this.canvas.height, 0, this.channel[i]),
			    5,
			    0,
			    2 * Math.PI
            );
		    ctx.fill();
	    }
    	ctx.beginPath();
	    ctx.strokeStyle = this.color;
    	ctx.moveTo(0, lerp(0, 255, this.canvas.height, 0, this.channel[0]));
	    for (var i = 1; i < this.channel.length; ++i) {
		    ctx.lineTo(
			    i * point_diff,
			    lerp(0, 255, this.canvas.height, 0, this.channel[i])
		    );
	    }
	    ctx.stroke();
    }
}


function generate_channel_list(channel) {
    let result = "[";
    for (var i = 0; i < channel.length; ++i) {
        result += "(";
        result += round_to_n(i / (channel.length - 1), 5);
        result += ",";
        for (var j = 0; j < 2; ++j) {
            result += round_to_n(channel[i] / 255, 5);
            if (j != 1) result += ",";
        }
        result += "),";
    }
    result += "]";
    return result;
}


function generate_cmap() {
    let result = "matplotlib.colors.LinearSegmentedColormap(\"" + cmap_name + "\",{";
    result += "\"red\":";
    result += generate_channel_list(red_class.channel_vals);
    result += ",\"green\":";
    result += generate_channel_list(green_class.channel_vals);
    result += ",\"blue\":";
    result += generate_channel_list(blue_class.channel_vals);
    result += ",\"alpha\":";
    result += generate_channel_list(alpha_class.channel_vals);
    result += "},";
    result += bins;
    result += ")"
    output.innerHTML = result;
}


function lerp(x0, x1, y0, y1, x) {
    return Math.round(y0 + (x - x0) * (y1 - y0) / (x1 - x0));
}


function get_color(index) {
    for (var i = 1; i < channel_points; ++i) {
        if (index < i * bins / channel_segments) {
            let x0 = (i - 1) * bins / channel_segments;
            let x1 = i * bins / channel_segments;
            let r = lerp(x0, x1, red_class.channel[i - 1], red_class.channel[i], index);
            let g = lerp(x0, x1, green_class.channel[i - 1], green_class.channel[i], index);
            let b = lerp(x0, x1, blue_class.channel[i - 1], blue_class.channel[i], index);
            let a = lerp(x0, x1, alpha_class.channel[i - 1], alpha_class.channel[i], index) / 255;
            return "rgba(" + r + "," + g + "," + b + "," + a + ")";
        }
    }
    return "#000000";
}


function draw_colormap() {
    const bar_width = colormap.width / bins;
    var ctx = colormap.getContext("2d");
	ctx.fillStyle = "rgba(255, 255, 255, 1)";
	ctx.fillRect(0, 0, colormap.width, colormap.height);
    for (let i = 0; i < bins; ++i) {
        ctx.fillStyle = get_color(i);
        ctx.fillRect(i * bar_width, 0, bar_width + 1, colormap.height);
    }
}


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


function copy_to_clipboard() {
    navigator.clipboard.writeText(output.innerHTML).then(
        function() {
            copy_btn.innerHTML = "Copied!";
            sleep(3000).then(
                function() {
                    copy_btn.innerHTML = "Copy to clipboard";
                }
            );
        },
        function() {
            alert("Copying to clipboard failed!");
        }
    );
}


function pos_in_canvas(event, canvas) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: (event.clientX - rect.left) / canvas.width,
        y: (event.clientY - rect.top) / canvas.height
    }
}


$(document).ready(function() {
	name_input = document.getElementById("name_input");
	name_input.value = "cmap";
	cmap_name = name_input.value;
	bins_input = document.getElementById("bins_input");
	bins_input.value = 256;
	bins = bins_input.value;
	set_segments(8);
    output = document.getElementById("output");
    colormap = document.getElementById("colormap");
    colormap_ctx = colormap.getContext("2d");
    copy_btn = document.getElementById("copy_btn");
	red_canvas = document.getElementById("red");
	green_canvas = document.getElementById("green");
	blue_canvas = document.getElementById("blue");
	alpha_canvas = document.getElementById("alpha");
    red_class = new Channel(red_channel, red_canvas, "#FF0000");
    green_class = new Channel(green_channel, green_canvas, "#00FF00");
    blue_class = new Channel(blue_channel, blue_canvas, "#0000FF");
    alpha_class = new Channel(alpha_channel, alpha_canvas, "#000000");
	red_class.draw();
    green_class.draw();
    blue_class.draw();
    alpha_class.draw();
    generate_cmap();
    draw_colormap();
	$(name_input).change(function() {
		cmap_name = name_input.value;
		generate_cmap();
	});
	$(bins_input).change(function() {
		bins = bins_input.value;
		if (bins > 256) bins = 256
		if (bins < 10) bins = 10
		bins_input.value = bins;
		generate_cmap();
		draw_colormap();
	});
    $(red_canvas)
        .mousedown(function(e) {
            red_class.isDragging = false;
            red_class.mouseDown = true;
            var pos = pos_in_canvas(e, this);
            red_class.currIndex = lerp(0, 1, 0, channel_points - 1, pos.x);
        })
        .mousemove(function(e) {
            red_class.isDragging = true;
            
            if (red_class.isDragging === true 
                    && red_class.mouseDown === true
                    && red_class.currIndex != -1) {
                var pos = pos_in_canvas(e, this);
                var value = lerp(0, 1, 255, 0, pos.y);
                red_class.channelAt(red_class.currIndex, value);
                red_class.draw();
                generate_cmap();
		        draw_colormap();
            }
         })
        .mouseup(function(e) {
            var was_dragging = red_class.isDragging;

            red_class.isDragging = false;
            red_class.mouseDown = false;

            if (!was_dragging) {
                var pos = pos_in_canvas(e, this);
                var value = lerp(0, 1, 255, 0, pos.y);
                red_class.channelAt(red_class.currIndex, value);
                red_class.draw();
                generate_cmap();
		        draw_colormap();
            }
            red_class.currIndex = -1;
        }
    );
    $(green_canvas)
        .mousedown(function(e) {
            green_class.isDragging = false;
            green_class.mouseDown = true;
            var pos = pos_in_canvas(e, this);
            green_class.currIndex = lerp(0, 1, 0, channel_points - 1, pos.x);
        })
        .mousemove(function(e) {
            green_class.isDragging = true;
            
            if (green_class.isDragging === true && green_class.mouseDown === true && green_class.currIndex !== -1) {
                var pos = pos_in_canvas(e, this);
                var value = lerp(0, 1, 255, 0, pos.y);
                green_class.channelAt(green_class.currIndex, value);
                green_class.draw();
                generate_cmap();
		        draw_colormap();
            }
         })
        .mouseup(function(e) {

            var was_dragging = green_class.isDragging;

            green_class.isDragging = false;
            green_class.mouseDown = false;

            if (!was_dragging) {
                var pos = pos_in_canvas(e, this);
                var value = lerp(0, 1, 255, 0, pos.y);
                green_class.channelAt(green_class.currIndex, value);
                green_class.draw();
                generate_cmap();
		        draw_colormap();
            }
            green_class.currIndex = -1;
        }
    );
    $(blue_canvas)
        .mousedown(function(e) {
            blue_class.isDragging = false;
            blue_class.mouseDown = true;
            var pos = pos_in_canvas(e, this);
            blue_class.currIndex = lerp(0, 1, 0, channel_points - 1, pos.x);
        })
        .mousemove(function(e) {
            blue_class.isDragging = true;
            
            if (blue_class.isDragging === true && blue_class.mouseDown === true && blue_class.currIndex !== -1) {
                var pos = pos_in_canvas(e, this);
                var value = lerp(0, 1, 255, 0, pos.y);
                blue_class.channelAt(blue_class.currIndex, value);
                blue_class.draw();
                generate_cmap();
		        draw_colormap();
            }
         })
        .mouseup(function(e) {

            var was_dragging = blue_class.isDragging;

            blue_class.isDragging = false;
            blue_class.mouseDown = false;

            if (!was_dragging) {
                var pos = pos_in_canvas(e, this);
                var value = lerp(0, 1, 255, 0, pos.y);
                blue_class.channelAt(blue_class.currIndex, value);
                blue_class.draw();
                generate_cmap();
		        draw_colormap();
            }
            blue_class.currIndex = -1;
        }
    );
    $(alpha_canvas)
        .mousedown(function(e) {
            alpha_class.isDragging = false;
            alpha_class.mouseDown = true;
            var pos = pos_in_canvas(e, this);
            alpha_class.currIndex = lerp(0, 1, 0, channel_points - 1, pos.x);
        })
        .mousemove(function(e) {
            alpha_class.isDragging = true;
            
            if (alpha_class.isDragging === true && alpha_class.mouseDown === true && alpha_class.currIndex !== -1) {
                var pos = pos_in_canvas(e, this);
                var value = lerp(0, 1, 255, 0, pos.y);
                alpha_class.channelAt(alpha_class.currIndex, value);
                alpha_class.draw();
                generate_cmap();
		        draw_colormap();
            }
         })
        .mouseup(function(e) {

            var was_dragging = alpha_class.isDragging;

            alpha_class.isDragging = false;
            alpha_class.mouseDown = false;

            if (!was_dragging) {
                var pos = pos_in_canvas(e, this);
                var value = lerp(0, 1, 255, 0, pos.y);
                alpha_class.channelAt(alpha_class.currIndex, value);
                alpha_class.draw();
                generate_cmap();
		        draw_colormap();
            }
            alpha_class.currIndex = -1;
        }
    );
}).mouseup(function() {
    red_class.isDragging = false;
    red_class.mouseDown = false;
    red_class.currIndex = -1;
    green_class.isDragging = false;
    green_class.mouseDown = false;
    green_class.currIndex = -1;
    blue_class.isDragging = false;
    blue_class.mouseDown = false;
    blue_class.currIndex = -1;
    alpha_class.isDragging = false;
    alpha_class.mouseDown = false;
    alpha_class.currIndex = -1;
});

$(window).resize(function() {
    red_class.scale_canvas();
    red_class.draw();
    green_class.scale_canvas();
    green_class.draw();
    blue_class.scale_canvas();
    blue_class.draw();
    alpha_class.scale_canvas();
    alpha_class.draw();
    draw_colormap();
});
