function $(str) {return document.getElementById(str);}

function clone(obj) {
    return Object.assign(Object.create(Object.getPrototypeOf(obj)), obj);
}

function cloneBody(obj) {
    let new_body = clone(obj);
    new_body.pos = obj.pos.copy();
    new_body.old_pos = obj.old_pos.copy();
    new_body.accel = obj.accel.copy();
    return new_body;
}

class Vector2D {
    constructor(x, y) {
        if (x == undefined) {
            this.x = 0;
            this.y = 0;
            return;
        }
        this.x = x;
        this.y = y;
    }

    get magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    invert() {
        return new Vector2D(-this.x, -this.y);
    }

    add(other) {
        if (typeof other != "number") {
            return new Vector2D(this.x + other.x, this.y + other.y);
        }
        return new Vector2D(this.x + other, this.y + other);
    }

    sub(other) {
        if (typeof other != "number") {
            return new Vector2D(this.x - other.x, this.y - other.y);
        }
        return new Vector2D(this.x - other, this.y - other);
    }

    mult(other) {
        if (typeof other != "number") {
            return new Vector2D(this.x * other.x, this.y * other.y);
        }
        return new Vector2D(this.x * other, this.y * other);
    }

    div(other) {
        if (typeof other != "number") {
            return new Vector2D(this.x / other.x, this.y / other.y);
        }
        return new Vector2D(this.x / other, this.y / other);
    }

    transform() {
        return new Vector2D(window.game.scale_factor * this.x, window.game.scale_factor * this.y);
    }

    copy() {
        return new Vector2D(this.x, this.y);
    }
}

class CelestialBody {
    constructor() {
        this.pos = new Vector2D();
        this.old_pos = new Vector2D();
        this.accel = new Vector2D();
        this.radius = 50;
        this.density = 1;
        this.color = "#ffffff";
    }

    pos; //Vector2D
    old_pos; //Vector2D
    accel; //Vector2D
    radius; //number
    density; //number
    color; //string
}

window.game = class {
    static g_const = 0.00119366;
    static scale_factor = 1;
    
    static anim_ship_blink = 0;
    static is_simulating = false;
    static ship_dead = false;

    static level = 1;

    static ship = class {
        static pos = new Vector2D();
        static old_pos = new Vector2D();
        static accel = new Vector2D();
    }

    static opt = class {
        static use_ghost = true;
        static max_ghost_length = 1800;
        static planetary_attraction = false;
    }

    static mouse = class {
        static x = undefined;
        static y = undefined;
        static real = new Vector2D();

        static o_drag_id = undefined;
        static o_drag_x = undefined;
        static o_drag_y = undefined;
        static o_drag_ox = undefined;
        static o_drag_oy = undefined;
    }

    static new_circle = class {
        static center = undefined;
        static radius = undefined;
    }

    static sidebar = class {
        static selected_id = -2;
    }

    static bodies = [];
    static bodies_copy = [];
}

//#region Load Images
let ship_texture = new Image();
ship_texture.src = "https://static.vecteezy.com/system/resources/previews/008/507/286/original/lens-flare-light-special-effect-free-png.png";

let satellite_texture = new Image();
satellite_texture.src = "https://cdn.britannica.com/57/4957-050-D5B48D7B/spacecraft-depiction-artist-body-Voyager-receivers-dish.jpg";

let axis_texture = new Image();
axis_texture.src = "https://pxlpkr.github.io/gravity-game/axis_marker.png";

let explosion_texture = new Image();
explosion_texture.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Explosion-155624_icon.svg/2048px-Explosion-155624_icon.svg.png";
//#endregion

function loadLevel(level_id) {
    window.game.ship.pos = new Vector2D();
    window.game.ship.old_pos = new Vector2D();
    window.game.ship.accel = new Vector2D();
    window.game.bodies = [];
    switch (level_id) {
        case 1:
            window.game.ship.pos = new Vector2D(300, 200);
            window.game.ship.old_pos = new Vector2D(295, 200);
            let new_body = new CelestialBody();
            new_body.pos = new Vector2D(600, 200);
            new_body.old_pos = new Vector2D(600, 200);
            new_body.radius = 100;
            new_body.density = 1;
            window.game.bodies.push(new_body);

            new_body = new CelestialBody();
            new_body.pos = new Vector2D(600, 600);
            new_body.old_pos = new Vector2D(600, 600);
            new_body.radius = 50;
            new_body.density = 1;
            window.game.bodies.push(new_body);
        break;
    }
    updateGhost();
}

function resetLevel() {
    button_start.style.backgroundImage = "url('https://pxlpkr.github.io/gravity-game/button_play.png')";

    loadLevel(window.game.level);

    window.game.bodies = window.game.bodies_copy;
    window.game.bodies_copy = [];

    window.game.is_simulating = false;
    window.game.ship_dead = false;
    window.game.anim_ship_blink = 0;

    updateInfoBoxes();
    updateGhost();
}

/* Ghost simulation functions */
function loadGhost() {
    window.ghost.ship.pos = window.game.ship.pos.copy();
    window.ghost.ship.old_pos = window.game.ship.old_pos.copy();
    window.ghost.ship.accel = window.game.ship.accel.copy();

    window.ghost.bodies = [];
    for (const body of window.game.bodies) {
        window.ghost.bodies.push(cloneBody(body));
    }

    window.ghost.g_const = window.game.g_const;
}

function updateGhost() {
    if (!window.game.opt.use_ghost)
        return;

    loadGhost();
    window.ghost.last.ship_positions = [];
    let o = simulate(window.ghost);
    for (let i = 0; o != 1 && i < window.game.opt.max_ghost_length; i++) {
        window.ghost.last.ship_positions.push(window.ghost.ship.pos.copy());
        o = simulate(window.ghost);
    }
}

window.ghost = class {
    static ship = class {
        static pos = new Vector2D();
        static old_pos = new Vector2D();
        static accel = new Vector2D();
    }

    static bodies;

    static g_const;

    static last = class {
        static ship_positions = [];
    }
}

function loadDynamicElements() {
    let body = document.body;
    let html = document.documentElement;
  
    let canvasHeight = Math.max(
        body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight
    );
  
    let width = document.body.clientWidth-Math.min(canvasHeight*0.2);
    let height = canvasHeight;
    let size = 0.8*Math.min(width, height);

    let canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    canvas.id = "canvas";
    canvas.style = `position: absolute; width: ${size}px; height: ${size}px; left: ${(width-size)/2}px; top: ${(height-size)/2}px; border-style: solid; border-width: 1px; border-color: #888888`;
    body.appendChild(canvas);
    window.game.scale_factor = size/800;

    let button_start = document.createElement("div");
    button_start.style = `position: absolute; width: ${size*0.08}px; height: ${size*0.08}px; left: ${(width-size)/2}px; top: ${(height-size)/2 - size*0.08 - 5}px; border-style: solid; border-width: 1px; border-color: #888888; background-size: ${size*0.08}px`;
    button_start.style.backgroundImage = "url('https://pxlpkr.github.io/gravity-game/button_play.png')";
    button_start.id = "button_start";
    button_start.addEventListener("click", (e) => {
        if (!editsAllowed()) {
            resetLevel();
        } else {
            button_start.style.backgroundImage = "url('https://pxlpkr.github.io/gravity-game/button_pause.png')";
            
            window.game.bodies_copy = [];
            for (const body of window.game.bodies) {
                window.game.bodies_copy.push(cloneBody(body));
            }

            window.game.is_simulating = true;
        }
    });
    body.appendChild(button_start);

    for (const id_ of getInfoBoxes()) {
        $(id_).addEventListener("click", (e) => {
            if (window.game.ship_dead) {
                resetLevel();
            }
        });
    }

    let body_preview = document.createElement("canvas");
    body_preview.width = width * 0.18;
    body_preview.height = width * 0.18;
    body_preview.id = "body_preview";
    body_preview.style = `position: absolute; left: ${width*0.02}px; top: ${width*0.02}px; width: ${width * 0.18}px; height: ${width * 0.18}px; border-style: solid; border-width: 1px; border-color: #888888; z-index: 1`;
    $("sidebar").appendChild(body_preview);

    $("info_box_container").style.top = `${width*0.04 + width * 0.18}px`
    $("info_box_container").style.height = `${height - width*0.04 - width * 0.18}px`
}

let editsAllowed = () => !window.game.is_simulating && !window.game.ship_dead;
let getInfoBoxes = () => [
    "info_position_x", "info_position_y",
    "info_velocity_x", "info_velocity_y",
    "info_radius",     "info_density"    ];

function updateInfoBoxes() {
    if (!editsAllowed() || window.game.sidebar.selected_id < 0) {
        for (const id_ of getInfoBoxes()) {
            $(id_).readOnly = true;
            $(id_).style.color = "#888888";
        }
    } else {
        for (const id_ of getInfoBoxes()) {
            $(id_).readOnly = false;
            $(id_).style.color = "#ffffff";
        }
    }

    if (window.game.sidebar.selected_id < 0) {
        for (const id_ of getInfoBoxes()) {
            $(id_).value = "???";
        }
    }

    if (window.game.sidebar.selected_id == -1) {
        $("info_position_x").value = window.game.ship.pos.x;
        $("info_position_y").value = window.game.ship.pos.y;
        $("info_velocity_x").value = (window.game.ship.pos.x - window.game.ship.old_pos.x);
        $("info_velocity_y").value = (window.game.ship.pos.y - window.game.ship.old_pos.y);
        $("info_radius").value = "Quite small";
        $("info_density").value = "Not very";
        $("body_preview").getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        $("body_preview").getContext("2d").drawImage(satellite_texture, 0, 0, $("body_preview").width, $("body_preview").height);
    } else if (window.game.sidebar.selected_id == -2) {
        $("body_preview").getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    } else {
        let s_body = window.game.bodies[window.game.sidebar.selected_id];
        if (typeof s_body == 'undefined') {
            window.game.sidebar.selected_id = -2;
            updateInfoBoxes();
            return;
        }
        $("info_position_x").value = s_body.pos.x;
        $("info_position_y").value = s_body.pos.y;
        $("info_velocity_x").value = (s_body.pos.x - s_body.old_pos.x);
        $("info_velocity_y").value = (s_body.pos.y - s_body.old_pos.y);
        $("info_radius").value = s_body.radius;
        $("info_density").value = s_body.density;
        $("body_preview").getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        $("body_preview").getContext("2d").beginPath();
        $("body_preview").getContext("2d").arc($("body_preview").width/2, $("body_preview").height/2, $("body_preview").height/3, 0, 2 * Math.PI, false);
        $("body_preview").getContext("2d").fillStyle = s_body.color;
        $("body_preview").getContext("2d").fill();
    }
}

function get_body_mass(body) {
    return (4.0/3.0) * Math.PI * body.density * body.radius * body.radius * body.radius;
}

function kill_ship() {
    button_start.style.backgroundImage = "url('https://pxlpkr.github.io/gravity-game/button_restart.png')";

    window.game.ship_dead = true;
    window.game.is_simulating = false;
}

function simulate(env) {

    for (const body of env.bodies) {
        
        // Apply gravity to ship
        let diff = body.pos.sub(env.ship.pos);
        let dist = diff.magnitude;

        let aG = (env.g_const * get_body_mass(body)) / (dist * dist);

        env.ship.accel.x += aG * (diff.x / dist);
        env.ship.accel.y += aG * (diff.y / dist);

        // Apply gravity to other bodies
        if (!window.game.opt.planetary_attraction)
            continue;

        for (const other of env.bodies) {
            if (other == body)
                continue;

            let diff1 = body.pos.sub(other.pos);
            let dist1 = diff1.magnitude;
            let bG = (env.g_const * get_body_mass(body)) / (dist1 * dist1);

            other.accel.x += bG * (diff1.x / dist1);
            other.accel.y += bG * (diff1.y / dist1);
        }
    }

    // Move all bodies
    for (const body of env.bodies) {
        v = body.pos.sub(body.old_pos).add(body.accel);
        body.old_pos = body.pos.copy();
        body.pos = body.pos.add(v);
        body.accel = new Vector2D(0, 0);
    }

    // Body collisions
    for (let i = 0; i < env.bodies.length; i++) {
        let body = env.bodies[i];
        for (let j = i + 1; j < env.bodies.length; j++) {
            let other = env.bodies[j];

            let diff = body.pos.sub(other.pos);
            let magnitude = body.radius + other.radius - diff.magnitude;

            if (magnitude > 0) {
                let mass_ratio = get_body_mass(other) / (get_body_mass(other) + get_body_mass(body));

                let movement = diff.mult(magnitude / (body.radius + other.radius));
                body.pos = body.pos.add(movement.mult(mass_ratio));
                other.pos = other.pos.add(movement.mult(-(1-mass_ratio)));
            }
        }
    }

    // Move ship
    v = env.ship.pos.sub(env.ship.old_pos).add(env.ship.accel);
    env.ship.old_pos = env.ship.pos.copy();
    env.ship.pos = env.ship.pos.add(v);
    env.ship.accel = new Vector2D(0, 0);

    // Check if ship crashes
    if (env.ship.pos.x > 800 || env.ship.pos.y > 800 || env.ship.pos.x < 0 || env.ship.pos.y < 0) {
        return 1;
    }

    for (const body of env.bodies) {
        let diff_x = Math.abs(env.ship.pos.x - body.pos.x);
        let diff_y = Math.abs(env.ship.pos.y - body.pos.y);

        if (Math.sqrt(diff_x * diff_x + diff_y * diff_y) < body.radius) {
            return 1;
        }
    }

    return 0;
}

function drawImageAround(texture, real_loc, size) {
    let loc = real_loc.transform();
    $("canvas").getContext("2d").drawImage(texture,
        loc.x-size.x/2, loc.y-size.y/2, size.x, size.y
    );
}

function drawCircleAround(color, real_loc, radius, fill) {
    let loc = real_loc.transform();
    let ctx = $("canvas").getContext("2d");
    ctx.beginPath();
    ctx.arc(loc.x, loc.y, radius * window.game.scale_factor, 0, 2 * Math.PI, false);
    if (fill) {
        ctx.fillStyle = color;
        ctx.fill();
    } else {
        ctx.lineWidth = 2;
        ctx.strokeStyle = color;
        ctx.stroke()
    }
}

function drawLine(color, real_a, real_b, strokeWidth) {
    let a = real_a.transform();
    let b = real_b.transform();
    let ctx = $("canvas").getContext("2d");

    ctx.strokeStyle = color;
    if (strokeWidth != undefined) {
        ctx.lineWidth = strokeWidth;
    } else {
        ctx.lineWidth = 2;
    }
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
}

function tick() {
    if (window.game.is_simulating) {
        if (simulate(window.game)) {
            kill_ship();
        }
        updateInfoBoxes();
    }

    render();

    setTimeout(tick, 1000/60);
}

function render() {
    let ctx = $("canvas").getContext("2d");

    // Clear canvas
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, $("canvas").width, $("canvas").height);

    // Draw every planet
    for (const body of window.game.bodies) {
        drawCircleAround(body.color, body.pos, body.radius, true);
    }

    // Draw circle user is currently adding
    if (window.game.new_circle.center != undefined) {
        drawCircleAround("#ffffff", window.game.new_circle.center, window.game.new_circle.radius, false);
        drawLine("#ffffff", window.game.new_circle.center, window.game.mouse.real);
    }

    // Draw outline
    if (editsAllowed()) {
        for (const pt of window.ghost.last.ship_positions) {
            drawCircleAround("#ffffff", pt, 2, true);
        }
    }

    // Draw ship
    if (window.game.ship_dead) {
        drawImageAround(explosion_texture, window.game.ship.pos, new Vector2D(80, 80));
    } else {
        window.game.anim_ship_blink = (window.game.anim_ship_blink + 1) % 60;
        if (window.game.anim_ship_blink < 30 || window.game.is_simulating) {
            drawImageAround(ship_texture, window.game.ship.pos, new Vector2D(80, 80));
        }
    }

    // Draw axis
    ctx.drawImage(axis_texture, 5, 5);
}

/* User Interactions */
function deleteCurrentBody() {
    if (!editsAllowed)
        return;
    if (window.game.sidebar.selected_id < 0)
        return;

    window.game.bodies.splice(window.game.sidebar.selected_id, 1);
    window.game.sidebar.selected_id = -2;
    updateInfoBoxes();
    updateGhost();
}

function editCurrentBody(id_, callback) {
    let body = window.game.bodies[window.game.sidebar.selected_id];
    let value = parseFloat($(id_).value);
    if (!isNaN(value)) {
        callback(body, value);
        updateGhost();
    }
}

function hsv2rgb(h,s,v) {let f = (n,k=(n+h/60)%6) => v - v*s*Math.max( Math.min(k,4-k,1), 0); return [f(5),f(3),f(1)];}

function spawnNewBody() {
    let new_body = new CelestialBody();
    new_body.pos = window.game.new_circle.center.copy();
    new_body.old_pos = window.game.new_circle.center.copy();
    new_body.radius = window.game.new_circle.radius;
    new_body.density = 1;
    let n = hsv2rgb(Math.round(Math.random() * 360), 0.5, 1);
    new_body.color = `rgb(${360*n[0]}, ${360*n[1]}, ${360*n[2]})`;
    window.game.bodies.push(new_body);

    window.game.new_circle.center = undefined;
    window.game.new_circle.radius = undefined;

    updateGhost();
}

window.onload = () => {
    loadDynamicElements();
    loadLevel(1);
    updateInfoBoxes();
    tick();

    $("canvas").addEventListener("mousedown", (e) => {
        window.game.mouse.x = (e.layerX / e.target.getBoundingClientRect().width) * 800;
        window.game.mouse.y = (e.layerY / e.target.getBoundingClientRect().height) * 800;
        window.game.sidebar.selected_id = -2;

        if (Math.abs(window.game.ship.pos.x - window.game.mouse.x) < 20 && Math.abs(window.game.ship.pos.y - window.game.mouse.y) < 20) {
            window.game.sidebar.selected_id = -1;
        }

        let i = 0;
        for (const body of window.game.bodies) {
            let diff_x = Math.abs(window.game.mouse.x - body.pos.x);
            let diff_y = Math.abs(window.game.mouse.y - body.pos.y);
            if (Math.sqrt(diff_x * diff_x + diff_y * diff_y) < body.radius) {
                window.game.mouse.o_drag_id = i;
                window.game.mouse.o_drag_x = body.pos.x;
                window.game.mouse.o_drag_y = body.pos.y;
                window.game.mouse.o_drag_ox = body.old_pos.x;
                window.game.mouse.o_drag_oy = body.old_pos.y;
                window.game.sidebar.selected_id = i;
                break;
            }
            i++;
        }

        updateInfoBoxes();
    });

    $("canvas").addEventListener("mouseup", (e) => {
        if (editsAllowed() && window.game.new_circle.center != undefined) {
            spawnNewBody();
        }
        window.game.mouse.x = undefined;
        window.game.mouse.y = undefined;
        window.game.mouse.o_drag_id = undefined;
        window.game.mouse.o_drag_x = undefined;
        window.game.mouse.o_drag_y = undefined;
        window.game.mouse.o_drag_ox = undefined;
        window.game.mouse.o_drag_oy = undefined;
    });

    $("canvas").addEventListener("mousemove", (e) => {
        let mouse_x = (e.layerX / e.target.getBoundingClientRect().width) * 800;
        let mouse_y = (e.layerY / e.target.getBoundingClientRect().height) * 800;

        window.game.mouse.real = new Vector2D(mouse_x, mouse_y);

        let diff = new Vector2D(mouse_x - window.game.mouse.x, mouse_y - window.game.mouse.y);

        if (editsAllowed()) {
            if (window.game.mouse.o_drag_id != undefined) {
                let body = window.game.bodies[window.game.mouse.o_drag_id];
                let x_diff = diff.x;
                let y_diff = diff.y;
                if (diff.magnitude < 5) {
                    x_diff = 0;
                    y_diff = 0;
                }
                body.pos.x = window.game.mouse.o_drag_x + x_diff;
                body.pos.y = window.game.mouse.o_drag_y + y_diff;
                body.old_pos.x = window.game.mouse.o_drag_ox + x_diff;
                body.old_pos.y = window.game.mouse.o_drag_oy + y_diff;

                // // Stop overlap
                // for (const other of window.game.bodies) {
                //     if (other == body)
                //         continue;
        
                //     let diff = body.pos.sub(other.pos);
        
                //     if (diff.magnitude < body.radius + other.radius) {
                //         // 10 5 // 14 // (15, 0) * (1/15)
                //         // 150 // 150

                //         // diff = (100, 0)
                //         // mag = (50)
                //         // move = (50, 0)
                //         let movement = diff.mult((magnitude) / (body.radius + other.radius));
                //         console.log(movement);
                //         body.pos = body.pos.add(movement);
                //         body.old_pos = body.old_pos.add(movement);
                //     }
                // }

                updateInfoBoxes();
                updateGhost();
            } else if (window.game.mouse.x != undefined) {
                if (diff.magnitude > 5) {
                    window.game.new_circle.center = new Vector2D(window.game.mouse.x, window.game.mouse.y);
                    window.game.new_circle.radius = diff.magnitude;
                } else {
                    window.game.new_circle.center = undefined;
                    window.game.new_circle.radius = undefined;
                }
            }
        } else if (window.game.ship_dead && diff.magnitude > 5) {
            resetLevel();
        }
    })

    /* Informationable editables */

    $("info_position_x").addEventListener("input", (e) => {
        editCurrentBody("info_position_x", (body, value) => {
            body.old_pos.x = body.old_pos.x - body.pos.x + value;
            body.pos.x = value;
        });
    });

    $("info_position_y").addEventListener("input", (e) => {
        editCurrentBody("info_position_y", (body, value) => {
            body.old_pos.y = body.old_pos.y - body.pos.y + value;
            body.pos.y = value;
        });
    });

    $("info_velocity_x").addEventListener("input", (e) => {
        editCurrentBody("info_velocity_x", (body, value) => {
            body.old_pos.x = body.pos.x - value;
        });
    });

    $("info_velocity_y").addEventListener("input", (e) => {
        editCurrentBody("info_velocity_y", (body, value) => {
            body.old_pos.y = body.pos.y - value;
        });
    });

    $("info_radius").addEventListener("input", (e) => {
        editCurrentBody("info_radius", (body, value) => {
            body.radius = value;
        });
    });

    $("info_density").addEventListener("input", (e) => {
        editCurrentBody("info_density", (body, value) => {
            body.density = value;
        });
    });

    $("delete_body").addEventListener("click", (e) => {
        deleteCurrentBody();
    });
};