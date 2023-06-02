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
    static anim_win = 0;
    static is_simulating = false;
    static ship_dead = false;

    static level = 1;
    static max_level = 18;
    static level_name = "";

    static ship = class {
        static pos = new Vector2D();
        static old_pos = new Vector2D();
        static accel = new Vector2D();
    }

    static goal = class {
        static pos = new Vector2D();
    }

    static obstacles = [];

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

    static shift_down = false;
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

let end_texture = new Image();
end_texture.src = "https://pxlpkr.github.io/gravity-game/end_texture.png";

let satellite_texture = new Image();
satellite_texture.src = "https://cdn.britannica.com/57/4957-050-D5B48D7B/spacecraft-depiction-artist-body-Voyager-receivers-dish.jpg";

let blackhole_texture = new Image();
blackhole_texture.src = "https://upload.wikimedia.org/wikipedia/commons/4/4f/Black_hole_-_Messier_87_crop_max_res.jpg";

let axis_texture = new Image();
axis_texture.src = "https://pxlpkr.github.io/gravity-game/axis_marker.png";

let explosion_texture = new Image();
explosion_texture.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Explosion-155624_icon.svg/2048px-Explosion-155624_icon.svg.png";

let win_splash_texture = new Image();
win_splash_texture.src = "https://pxlpkr.github.io/gravity-game/win_splash.png";

let tutorial_splash_texture = new Image();
tutorial_splash_texture.src = "https://pxlpkr.github.io/gravity-game/tutorial.png";

//#endregion

function loadLevel(level_id) {
    window.game.ship.pos = new Vector2D();
    window.game.ship.old_pos = new Vector2D();
    window.game.ship.accel = new Vector2D();
    window.game.goal.pos = new Vector2D();
    window.game.bodies = [];
    window.game.obstacles = [];

    window.game.is_simulating = false;
    window.game.ship_dead = false;
    window.game.anim_ship_blink = 0;
    window.game.level_name = "";

    switch (level_id) {
        case 1:
            window.game.level_name = "Basic Swing";

            window.game.ship.pos = new Vector2D(300, 200);
            window.game.ship.old_pos = new Vector2D(300, 195);

            window.game.goal.pos = new Vector2D(500, 600);
        break;
        case 2:
            window.game.level_name = "Out and Back Again";

            window.game.ship.pos = new Vector2D(400, 100);
            window.game.ship.old_pos = new Vector2D(400, 97);

            window.game.goal.pos = new Vector2D(400, 700);

            window.game.obstacles = [
                [
                    new Vector2D(380, 380),
                    new Vector2D(380, 420),
                    new Vector2D(420, 420),
                    new Vector2D(420, 380)
                ]
            ];
        break;
        case 3:
            window.game.level_name = "Three Point Turn";

            window.game.ship.pos = new Vector2D(100, 100);
            window.game.ship.old_pos = new Vector2D(100, 90);

            window.game.goal.pos = new Vector2D(700, 100);
        break;
        case 4:
            window.game.level_name = "No Velocity, No Problem";
            
            window.game.ship.pos = new Vector2D(100, 100);
            window.game.ship.old_pos = new Vector2D(100, 100);

            window.game.goal.pos = new Vector2D(700, 700);

            window.game.obstacles = [
                [
                    new Vector2D(320, 380),
                    new Vector2D(320, 420),
                    new Vector2D(480, 420),
                    new Vector2D(480, 380)
                ],
                [
                    new Vector2D(380, 320),
                    new Vector2D(380, 480),
                    new Vector2D(420, 480),
                    new Vector2D(420, 320)
                ]
            ];
        break;
        case 5:
            window.game.level_name = "Backtracking";

            window.game.ship.pos = new Vector2D(400, 600);
            window.game.ship.old_pos = new Vector2D(400, 595);

            window.game.goal.pos = new Vector2D(400, 100);

            window.game.obstacles = [
                [
                    new Vector2D(300, 380),
                    new Vector2D(300, 420),
                    new Vector2D(500, 420),
                    new Vector2D(500, 380)
                ]
            ];
        break;
        case 6:
            window.game.level_name = "Corridor I";

            window.game.ship.pos = new Vector2D(200, 50);
            window.game.ship.old_pos = new Vector2D(200, 45);

            window.game.goal.pos = new Vector2D(700, 400);

            window.game.obstacles = [
                [
                    new Vector2D(400, 0),
                    new Vector2D(400, 320),
                    new Vector2D(800, 320),
                    new Vector2D(800, 0)
                ],
                [
                    new Vector2D(400, 800),
                    new Vector2D(400, 480),
                    new Vector2D(800, 480),
                    new Vector2D(800, 800)
                ]
            ];
        break;
        case 7:
            window.game.level_name = "Barrier to Entry";

            window.game.ship.pos = new Vector2D(50, 400);
            window.game.ship.old_pos = new Vector2D(49, 400);

            window.game.goal.pos = new Vector2D(750, 400);

            window.game.obstacles = [
                [
                    new Vector2D(125, 350),
                    new Vector2D(125, 450),
                    new Vector2D(700, 450),
                    new Vector2D(700, 350)
                ],
            ];
        break;
        case 8:
            window.game.level_name = "Chicane";

            window.game.ship.pos = new Vector2D(400, 50);
            window.game.ship.old_pos = new Vector2D(400, 47);

            window.game.goal.pos = new Vector2D(750, 750);

            window.game.obstacles = [
                [
                    new Vector2D(0, 300),
                    new Vector2D(0, 325),
                    new Vector2D(430, 325),
                    new Vector2D(430, 300)
                ],
                [
                    new Vector2D(400, 475),
                    new Vector2D(400, 500),
                    new Vector2D(800, 500),
                    new Vector2D(800, 475)
                ],
            ];
        break;
        case 9:
            window.game.level_name = "Triangulation";

            window.game.ship.pos = new Vector2D(50, 600);
            window.game.ship.old_pos = new Vector2D(50, 600);

            window.game.goal.pos = new Vector2D(750, 600);

            window.game.obstacles = [
                [
                    new Vector2D(0, 800),
                    new Vector2D(400, 200),
                    new Vector2D(800, 800)
                ]
            ];
        break;
        case 10:
            window.game.level_name = "Asteroid Field";

            window.game.ship.pos = new Vector2D(50, 50);
            window.game.ship.old_pos = new Vector2D(48, 48);

            window.game.goal.pos = new Vector2D(750, 750);

            window.game.obstacles = [];
            for (const pt of [
                new Vector2D(679, 125),
                new Vector2D(773, 64),
                new Vector2D(493, 388),
                new Vector2D(355, 484),
                new Vector2D(138, 533),
                new Vector2D(621, 562),
                new Vector2D(280, 603),
                new Vector2D(475, 622),
                new Vector2D(237, 7),
                new Vector2D(124, 412),
                new Vector2D(179, 651),
                new Vector2D(177, 566),
                new Vector2D(720, 713),
                new Vector2D(240, 99),
                new Vector2D(440, 615),
                new Vector2D(636, 570),
                new Vector2D(121, 109),
                new Vector2D(356, 176),
                new Vector2D(584, 324),
                new Vector2D(369, 191),
                new Vector2D(123, 526),
                new Vector2D(422, 453),
                new Vector2D(68, 466),
                new Vector2D(329, 774),
                new Vector2D(248, 248),
                new Vector2D(732, 348),
                new Vector2D(386, 208),
                new Vector2D(334, 142),
                new Vector2D(297, 48),
                new Vector2D(289, 524),
                new Vector2D(708, 277),
                new Vector2D(422, 364),
                new Vector2D(723, 131),
                new Vector2D(293, 20),
                new Vector2D(517, 103),
                new Vector2D(590, 391),
                new Vector2D(696, 797),
                new Vector2D(28, 367),
                new Vector2D(472, 783),
                new Vector2D(308, 745),
                new Vector2D(102, 29),
                new Vector2D(190, 697),
                new Vector2D(622, 220),
                new Vector2D(550, 253),
                new Vector2D(78, 406),
                new Vector2D(773, 586),
                new Vector2D(720, 335),
                new Vector2D(610, 736),
                new Vector2D(265, 388),
                new Vector2D(578, 702),
                new Vector2D(336, 554),
                new Vector2D(589, 791),
                new Vector2D(497, 380),
                new Vector2D(207, 441),
                new Vector2D(407, 670),
                new Vector2D(488, 689),
                new Vector2D(50, 84),
                new Vector2D(91, 473),
                new Vector2D(785, 85),
                new Vector2D(290, 414),
                new Vector2D(552, 752),
                new Vector2D(551, 271),
                new Vector2D(709, 267),
                new Vector2D(205, 530),
                new Vector2D(501, 715),
                new Vector2D(746, 728),
                new Vector2D(285, 714),
                new Vector2D(181, 268),
                new Vector2D(447, 151),
                new Vector2D(793, 386),
                new Vector2D(772, 2),
                new Vector2D(446, 420),
                new Vector2D(757, 534),
                new Vector2D(158, 95),
                new Vector2D(754, 172),
                new Vector2D(727, 40),
                new Vector2D(722, 465),
                new Vector2D(173, 176),
                new Vector2D(646, 626),
                new Vector2D(418, 330),
                new Vector2D(490, 179),
                new Vector2D(658, 666),
                new Vector2D(635, 766),
                new Vector2D(282, 787),
                new Vector2D(694, 267),
                new Vector2D(82, 91),
                new Vector2D(611, 6),
                new Vector2D(484, 207),
                new Vector2D(241, 7),
                new Vector2D(554, 216),
                new Vector2D(12, 162),
                new Vector2D(119, 119),
                new Vector2D(131, 630),
                new Vector2D(518, 262),
                new Vector2D(775, 779),
                new Vector2D(379, 564),
                new Vector2D(484, 453),
                new Vector2D(757, 481),
                new Vector2D(725, 575),
                new Vector2D(728, 641),
                new Vector2D(778, 484),
                new Vector2D(207, 781),
                new Vector2D(235, 312),
                new Vector2D(388, 792),
                new Vector2D(423, 418),
                new Vector2D(409, 124),
                new Vector2D(445, 95),
                new Vector2D(23, 723),
                new Vector2D(456, 256),
                new Vector2D(620, 697),
                new Vector2D(243, 214),
                new Vector2D(778, 751),
                new Vector2D(245, 501),
                new Vector2D(533, 280),
                new Vector2D(609, 640),
                new Vector2D(772, 552),
                new Vector2D(292, 22),
                new Vector2D(20, 517),
                new Vector2D(278, 127),
                new Vector2D(496, 161),
                new Vector2D(650, 534),
                new Vector2D(522, 154),
                new Vector2D(562, 699),
                new Vector2D(229, 333),
                new Vector2D(414, 160),
                new Vector2D(424, 108),
                new Vector2D(582, 466),
                new Vector2D(22, 755),
                new Vector2D(106, 237),
                new Vector2D(9, 422),
                new Vector2D(303, 458),
                new Vector2D(518, 779),
                new Vector2D(56, 732),
                new Vector2D(635, 500),
                new Vector2D(243, 223),
                new Vector2D(301, 411),
                new Vector2D(650, 134),
                new Vector2D(193, 607),
                new Vector2D(78, 729),
                new Vector2D(469, 335),
                new Vector2D(738, 302),
                new Vector2D(437, 420),
                new Vector2D(28, 407),
                new Vector2D(128, 94),
                new Vector2D(125, 223),
                new Vector2D(561, 428),
                new Vector2D(72, 187),
                new Vector2D(416, 296),
                new Vector2D(431, 104),
                new Vector2D(489, 556),
            ]) {
                window.game.obstacles.push([
                    new Vector2D(pt.x-4, pt.y-4),
                    new Vector2D(pt.x+4, pt.y-4),
                    new Vector2D(pt.x+4, pt.y+4),
                    new Vector2D(pt.x-4, pt.y+4)
                ]);
            }
        break;
        case 11:
            window.game.level_name = "This is the Part Where You Need to Start Abusing Density";
            
            window.game.ship.pos = new Vector2D(50, 50);
            window.game.ship.old_pos = new Vector2D(45, 50);

            window.game.goal.pos = new Vector2D(750, 750);

            window.game.obstacles = [
                [
                    new Vector2D(0, 800),
                    new Vector2D(0, 110),
                    new Vector2D(690, 110)
                ],
            ];
        break;
        case 12:
            window.game.level_name = "Thread the Needle";
            
            window.game.ship.pos = new Vector2D(100, 700);
            window.game.ship.old_pos = new Vector2D(100, 705);

            window.game.goal.pos = new Vector2D(700, 700);

            window.game.obstacles = [
                [
                    new Vector2D(350, 0),
                    new Vector2D(350, 60),
                    new Vector2D(450, 60),
                    new Vector2D(450, 0)
                ],
                [
                    new Vector2D(350, 90),
                    new Vector2D(350, 800),
                    new Vector2D(450, 800),
                    new Vector2D(450, 90)
                ]
            ];
        break;
        case 13:
            window.game.level_name = "Emergency Redirect";
            
            window.game.ship.pos = new Vector2D(600, 400);
            window.game.ship.old_pos = new Vector2D(585, 400);

            window.game.goal.pos = new Vector2D(150, 400);

            window.game.obstacles = [
                [
                    new Vector2D(650, 250),
                    new Vector2D(700, 250),
                    new Vector2D(700, 550),
                    new Vector2D(650, 550),
                ],
                [
                    new Vector2D(300, 350),
                    new Vector2D(350, 350),
                    new Vector2D(350, 450),
                    new Vector2D(300, 450),
                ]
            ];
        break;
        case 14:
            window.game.level_name = "Sine Wave";

            window.game.ship.pos = new Vector2D(50, 400);
            window.game.ship.old_pos = new Vector2D(47, 400);

            window.game.goal.pos = new Vector2D(750, 400);

            window.game.obstacles = [
                [
                    new Vector2D(0, 0),
                    new Vector2D(800, 0),
                    new Vector2D(800, 200),
                    new Vector2D(0, 200)
                ],
                [
                    new Vector2D(0, 800),
                    new Vector2D(800, 800),
                    new Vector2D(800, 600),
                    new Vector2D(0, 600)
                ],
                [
                    new Vector2D(200, 200),
                    new Vector2D(210, 200),
                    new Vector2D(210, 400),
                    new Vector2D(200, 400)
                ],
                [
                    new Vector2D(300, 600),
                    new Vector2D(310, 600),
                    new Vector2D(310, 400),
                    new Vector2D(300, 400)
                ],
                [
                    new Vector2D(400, 200),
                    new Vector2D(410, 200),
                    new Vector2D(410, 400),
                    new Vector2D(400, 400)
                ],
                [
                    new Vector2D(500, 600),
                    new Vector2D(510, 600),
                    new Vector2D(510, 400),
                    new Vector2D(500, 400)
                ],
                [
                    new Vector2D(600, 200),
                    new Vector2D(610, 200),
                    new Vector2D(610, 400),
                    new Vector2D(600, 400)
                ],
            ];
        break;
        case 15:
            window.game.level_name = "135°x2";

            window.game.ship.pos = new Vector2D(50, 50);
            window.game.ship.old_pos = new Vector2D(43, 50);

            window.game.goal.pos = new Vector2D(750, 750);

            window.game.obstacles = [
                [
                    new Vector2D(0, 100),
                    new Vector2D(600, 100),
                    new Vector2D(0, 700)
                ],
                [
                    new Vector2D(800, 100),
                    new Vector2D(200, 700),
                    new Vector2D(800, 700)
                ],
            ];
        break;
        case 16:
            window.game.level_name = "Corridor II";

            window.game.ship.pos = new Vector2D(600, 600);
            window.game.ship.old_pos = new Vector2D(600, 600);

            window.game.goal.pos = new Vector2D(50, 750);

            window.game.obstacles = [
                [
                    new Vector2D(0, 700),
                    new Vector2D(0, 300),
                    new Vector2D(475, 300)
                ],
                [
                    new Vector2D(100, 800),
                    new Vector2D(500, 800),
                    new Vector2D(500, 325)
                ],
            ];
        break;
        case 17:
            window.game.level_name = "Ludicrous Speed";

            window.game.ship.pos = new Vector2D(25, 25);
            window.game.ship.old_pos = new Vector2D(-20, 20);

            window.game.goal.pos = new Vector2D(400, 780);

            window.game.obstacles = [
                [
                    new Vector2D(0, 10),
                    new Vector2D(400, 10),
                    new Vector2D(400, 50)
                ],
                [
                    new Vector2D(0, 30),
                    new Vector2D(0, 75),
                    new Vector2D(400, 75)
                ],
                [
                    new Vector2D(0, 150),
                    new Vector2D(580, 150),
                    new Vector2D(0, 500)
                ],
                [
                    new Vector2D(800, 150),
                    new Vector2D(800, 500),
                    new Vector2D(100, 500)
                ],
                [
                    new Vector2D(0, 400),
                    new Vector2D(230, 400),
                    new Vector2D(230, 350),
                    new Vector2D(0, 350)
                ],
                [
                    new Vector2D(800, 225),
                    new Vector2D(555, 225),
                    new Vector2D(555, 275),
                    new Vector2D(800, 275)
                ],
                [
                    new Vector2D(10, 790),
                    new Vector2D(350, 790),
                    new Vector2D(350, 765),
                    new Vector2D(10, 765)
                ],
                [
                    new Vector2D(790, 790),
                    new Vector2D(450, 790),
                    new Vector2D(450, 765),
                    new Vector2D(790, 765)
                ],
                [
                    new Vector2D(60, 755),
                    new Vector2D(300, 755),
                    new Vector2D(300, 730),
                    new Vector2D(60, 730)
                ],
                [
                    new Vector2D(740, 755),
                    new Vector2D(500, 755),
                    new Vector2D(500, 730),
                    new Vector2D(740, 730)
                ],
                [
                    new Vector2D(110, 720),
                    new Vector2D(250, 720),
                    new Vector2D(250, 695),
                    new Vector2D(110, 695)
                ],
                [
                    new Vector2D(690, 720),
                    new Vector2D(550, 720),
                    new Vector2D(550, 695),
                    new Vector2D(690, 695)
                ],
            ];
        break;
        case 18:
            window.game.level_name = "I'm Pretty Sure This One is Impossible";

            window.game.ship.pos = new Vector2D(380, 15);
            window.game.ship.old_pos = new Vector2D(380, 13);

            window.game.goal.pos = new Vector2D(380, 785);

            window.game.obstacles = [
                [new Vector2D(232.65, 0.0), new Vector2D(240.82, 0.0), new Vector2D(240.82, 36.73), new Vector2D(232.65, 36.73)],
                [new Vector2D(436.73, 0.0), new Vector2D(444.9, 0.0), new Vector2D(444.9, 36.73), new Vector2D(436.73, 36.73)],
                [new Vector2D(600.0, 0.0), new Vector2D(608.16, 0.0), new Vector2D(608.16, 77.55), new Vector2D(600.0, 77.55)],
                [new Vector2D(722.45, 0.0), new Vector2D(730.61, 0.0), new Vector2D(730.61, 118.37), new Vector2D(722.45, 118.37)],
                [new Vector2D(28.57, 28.57), new Vector2D(200.0, 28.57), new Vector2D(200.0, 36.73), new Vector2D(28.57, 36.73)],
                [new Vector2D(240.82, 28.57), new Vector2D(281.63, 28.57), new Vector2D(281.63, 36.73), new Vector2D(240.82, 36.73)],
                [new Vector2D(314.29, 28.57), new Vector2D(363.27, 28.57), new Vector2D(363.27, 36.73), new Vector2D(314.29, 36.73)],
                [new Vector2D(395.92, 28.57), new Vector2D(404.08, 28.57), new Vector2D(404.08, 200.0), new Vector2D(395.92, 200.0)],
                [new Vector2D(444.9, 28.57), new Vector2D(485.71, 28.57), new Vector2D(485.71, 36.73), new Vector2D(444.9, 36.73)],
                [new Vector2D(518.37, 28.57), new Vector2D(567.35, 28.57), new Vector2D(567.35, 36.73), new Vector2D(518.37, 36.73)],
                [new Vector2D(608.16, 28.57), new Vector2D(648.98, 28.57), new Vector2D(648.98, 36.73), new Vector2D(608.16, 36.73)],
                [new Vector2D(681.63, 28.57), new Vector2D(689.8, 28.57), new Vector2D(689.8, 159.18), new Vector2D(681.63, 159.18)],
                [new Vector2D(763.27, 28.57), new Vector2D(800.0, 28.57), new Vector2D(800.0, 36.73), new Vector2D(763.27, 36.73)],
                [new Vector2D(69.39, 36.73), new Vector2D(77.55, 36.73), new Vector2D(77.55, 77.55), new Vector2D(69.39, 77.55)],
                [new Vector2D(191.84, 36.73), new Vector2D(200.0, 36.73), new Vector2D(200.0, 77.55), new Vector2D(191.84, 77.55)],
                [new Vector2D(273.47, 36.73), new Vector2D(281.63, 36.73), new Vector2D(281.63, 77.55), new Vector2D(273.47, 77.55)],
                [new Vector2D(355.1, 36.73), new Vector2D(363.27, 36.73), new Vector2D(363.27, 159.18), new Vector2D(355.1, 159.18)],
                [new Vector2D(518.37, 36.73), new Vector2D(526.53, 36.73), new Vector2D(526.53, 77.55), new Vector2D(518.37, 77.55)],
                [new Vector2D(28.57, 69.39), new Vector2D(36.73, 69.39), new Vector2D(36.73, 118.37), new Vector2D(28.57, 118.37)],
                [new Vector2D(77.55, 69.39), new Vector2D(118.37, 69.39), new Vector2D(118.37, 77.55), new Vector2D(77.55, 77.55)],
                [new Vector2D(151.02, 69.39), new Vector2D(159.18, 69.39), new Vector2D(159.18, 159.18), new Vector2D(151.02, 159.18)],
                [new Vector2D(200.0, 69.39), new Vector2D(240.82, 69.39), new Vector2D(240.82, 77.55), new Vector2D(200.0, 77.55)],
                [new Vector2D(281.63, 69.39), new Vector2D(355.1, 69.39), new Vector2D(355.1, 77.55), new Vector2D(281.63, 77.55)],
                [new Vector2D(404.08, 69.39), new Vector2D(518.37, 69.39), new Vector2D(518.37, 77.55), new Vector2D(404.08, 77.55)],
                [new Vector2D(559.18, 69.39), new Vector2D(600.0, 69.39), new Vector2D(600.0, 77.55), new Vector2D(559.18, 77.55)],
                [new Vector2D(640.82, 69.39), new Vector2D(681.63, 69.39), new Vector2D(681.63, 77.55), new Vector2D(640.82, 77.55)],
                [new Vector2D(730.61, 69.39), new Vector2D(771.43, 69.39), new Vector2D(771.43, 77.55), new Vector2D(730.61, 77.55)],
                [new Vector2D(110.2, 77.55), new Vector2D(118.37, 77.55), new Vector2D(118.37, 281.63), new Vector2D(110.2, 281.63)],
                [new Vector2D(232.65, 77.55), new Vector2D(240.82, 77.55), new Vector2D(240.82, 118.37), new Vector2D(232.65, 118.37)],
                [new Vector2D(477.55, 77.55), new Vector2D(485.71, 77.55), new Vector2D(485.71, 118.37), new Vector2D(477.55, 118.37)],
                [new Vector2D(559.18, 77.55), new Vector2D(567.35, 77.55), new Vector2D(567.35, 118.37), new Vector2D(559.18, 118.37)],
                [new Vector2D(640.82, 77.55), new Vector2D(648.98, 77.55), new Vector2D(648.98, 118.37), new Vector2D(640.82, 118.37)],
                [new Vector2D(36.73, 110.2), new Vector2D(77.55, 110.2), new Vector2D(77.55, 118.37), new Vector2D(36.73, 118.37)],
                [new Vector2D(191.84, 110.2), new Vector2D(232.65, 110.2), new Vector2D(232.65, 118.37), new Vector2D(191.84, 118.37)],
                [new Vector2D(240.82, 110.2), new Vector2D(322.45, 110.2), new Vector2D(322.45, 118.37), new Vector2D(240.82, 118.37)],
                [new Vector2D(436.73, 110.2), new Vector2D(477.55, 110.2), new Vector2D(477.55, 118.37), new Vector2D(436.73, 118.37)],
                [new Vector2D(518.37, 110.2), new Vector2D(559.18, 110.2), new Vector2D(559.18, 118.37), new Vector2D(518.37, 118.37)],
                [new Vector2D(600.0, 110.2), new Vector2D(640.82, 110.2), new Vector2D(640.82, 118.37), new Vector2D(600.0, 118.37)],
                [new Vector2D(763.27, 110.2), new Vector2D(771.43, 110.2), new Vector2D(771.43, 159.18), new Vector2D(763.27, 159.18)],
                [new Vector2D(69.39, 118.37), new Vector2D(77.55, 118.37), new Vector2D(77.55, 159.18), new Vector2D(69.39, 159.18)],
                [new Vector2D(314.29, 118.37), new Vector2D(322.45, 118.37), new Vector2D(322.45, 200.0), new Vector2D(314.29, 200.0)],
                [new Vector2D(518.37, 118.37), new Vector2D(526.53, 118.37), new Vector2D(526.53, 159.18), new Vector2D(518.37, 159.18)],
                [new Vector2D(600.0, 118.37), new Vector2D(608.16, 118.37), new Vector2D(608.16, 200.0), new Vector2D(600.0, 200.0)],
                [new Vector2D(0.0, 151.02), new Vector2D(69.39, 151.02), new Vector2D(69.39, 159.18), new Vector2D(0.0, 159.18)],
                [new Vector2D(159.18, 151.02), new Vector2D(240.82, 151.02), new Vector2D(240.82, 159.18), new Vector2D(159.18, 159.18)],
                [new Vector2D(273.47, 151.02), new Vector2D(314.29, 151.02), new Vector2D(314.29, 159.18), new Vector2D(273.47, 159.18)],
                [new Vector2D(436.73, 151.02), new Vector2D(518.37, 151.02), new Vector2D(518.37, 159.18), new Vector2D(436.73, 159.18)],
                [new Vector2D(559.18, 151.02), new Vector2D(600.0, 151.02), new Vector2D(600.0, 159.18), new Vector2D(559.18, 159.18)],
                [new Vector2D(640.82, 151.02), new Vector2D(681.63, 151.02), new Vector2D(681.63, 159.18), new Vector2D(640.82, 159.18)],
                [new Vector2D(689.8, 151.02), new Vector2D(763.27, 151.02), new Vector2D(763.27, 159.18), new Vector2D(689.8, 159.18)],
                [new Vector2D(232.65, 159.18), new Vector2D(240.82, 159.18), new Vector2D(240.82, 240.82), new Vector2D(232.65, 240.82)],
                [new Vector2D(477.55, 159.18), new Vector2D(485.71, 159.18), new Vector2D(485.71, 281.63), new Vector2D(477.55, 281.63)],
                [new Vector2D(559.18, 159.18), new Vector2D(567.35, 159.18), new Vector2D(567.35, 322.45), new Vector2D(559.18, 322.45)],
                [new Vector2D(28.57, 191.84), new Vector2D(110.2, 191.84), new Vector2D(110.2, 200.0), new Vector2D(28.57, 200.0)],
                [new Vector2D(118.37, 191.84), new Vector2D(200.0, 191.84), new Vector2D(200.0, 200.0), new Vector2D(118.37, 200.0)],
                [new Vector2D(240.82, 191.84), new Vector2D(281.63, 191.84), new Vector2D(281.63, 200.0), new Vector2D(240.82, 200.0)],
                [new Vector2D(322.45, 191.84), new Vector2D(395.92, 191.84), new Vector2D(395.92, 200.0), new Vector2D(322.45, 200.0)],
                [new Vector2D(404.08, 191.84), new Vector2D(444.9, 191.84), new Vector2D(444.9, 200.0), new Vector2D(404.08, 200.0)],
                [new Vector2D(518.37, 191.84), new Vector2D(559.18, 191.84), new Vector2D(559.18, 200.0), new Vector2D(518.37, 200.0)],
                [new Vector2D(608.16, 191.84), new Vector2D(689.8, 191.84), new Vector2D(689.8, 200.0), new Vector2D(608.16, 200.0)],
                [new Vector2D(722.45, 191.84), new Vector2D(800.0, 191.84), new Vector2D(800.0, 200.0), new Vector2D(722.45, 200.0)],
                [new Vector2D(273.47, 200.0), new Vector2D(281.63, 200.0), new Vector2D(281.63, 240.82), new Vector2D(273.47, 240.82)],
                [new Vector2D(681.63, 200.0), new Vector2D(689.8, 200.0), new Vector2D(689.8, 281.63), new Vector2D(681.63, 281.63)],
                [new Vector2D(28.57, 232.65), new Vector2D(77.55, 232.65), new Vector2D(77.55, 240.82), new Vector2D(28.57, 240.82)],
                [new Vector2D(151.02, 232.65), new Vector2D(232.65, 232.65), new Vector2D(232.65, 240.82), new Vector2D(151.02, 240.82)],
                [new Vector2D(281.63, 232.65), new Vector2D(477.55, 232.65), new Vector2D(477.55, 240.82), new Vector2D(281.63, 240.82)],
                [new Vector2D(518.37, 232.65), new Vector2D(526.53, 232.65), new Vector2D(526.53, 281.63), new Vector2D(518.37, 281.63)],
                [new Vector2D(567.35, 232.65), new Vector2D(648.98, 232.65), new Vector2D(648.98, 240.82), new Vector2D(567.35, 240.82)],
                [new Vector2D(722.45, 232.65), new Vector2D(800.0, 232.65), new Vector2D(800.0, 240.82), new Vector2D(722.45, 240.82)],
                [new Vector2D(69.39, 240.82), new Vector2D(77.55, 240.82), new Vector2D(77.55, 322.45), new Vector2D(69.39, 322.45)],
                [new Vector2D(191.84, 240.82), new Vector2D(200.0, 240.82), new Vector2D(200.0, 281.63), new Vector2D(191.84, 281.63)],
                [new Vector2D(355.1, 240.82), new Vector2D(363.27, 240.82), new Vector2D(363.27, 322.45), new Vector2D(355.1, 322.45)],
                [new Vector2D(722.45, 240.82), new Vector2D(730.61, 240.82), new Vector2D(730.61, 281.63), new Vector2D(722.45, 281.63)],
                [new Vector2D(0.0, 273.47), new Vector2D(36.73, 273.47), new Vector2D(36.73, 281.63), new Vector2D(0.0, 281.63)],
                [new Vector2D(118.37, 273.47), new Vector2D(159.18, 273.47), new Vector2D(159.18, 281.63), new Vector2D(118.37, 281.63)],
                [new Vector2D(200.0, 273.47), new Vector2D(240.82, 273.47), new Vector2D(240.82, 281.63), new Vector2D(200.0, 281.63)],
                [new Vector2D(273.47, 273.47), new Vector2D(322.45, 273.47), new Vector2D(322.45, 281.63), new Vector2D(273.47, 281.63)],
                [new Vector2D(395.92, 273.47), new Vector2D(444.9, 273.47), new Vector2D(444.9, 281.63), new Vector2D(395.92, 281.63)],
                [new Vector2D(485.71, 273.47), new Vector2D(518.37, 273.47), new Vector2D(518.37, 281.63), new Vector2D(485.71, 281.63)],
                [new Vector2D(600.0, 273.47), new Vector2D(681.63, 273.47), new Vector2D(681.63, 281.63), new Vector2D(600.0, 281.63)],
                [new Vector2D(689.8, 273.47), new Vector2D(722.45, 273.47), new Vector2D(722.45, 281.63), new Vector2D(689.8, 281.63)],
                [new Vector2D(763.27, 273.47), new Vector2D(771.43, 273.47), new Vector2D(771.43, 322.45), new Vector2D(763.27, 322.45)],
                [new Vector2D(151.02, 281.63), new Vector2D(159.18, 281.63), new Vector2D(159.18, 404.08), new Vector2D(151.02, 404.08)],
                [new Vector2D(232.65, 281.63), new Vector2D(240.82, 281.63), new Vector2D(240.82, 404.08), new Vector2D(232.65, 404.08)],
                [new Vector2D(273.47, 281.63), new Vector2D(281.63, 281.63), new Vector2D(281.63, 363.27), new Vector2D(273.47, 363.27)],
                [new Vector2D(314.29, 281.63), new Vector2D(322.45, 281.63), new Vector2D(322.45, 322.45), new Vector2D(314.29, 322.45)],
                [new Vector2D(436.73, 281.63), new Vector2D(444.9, 281.63), new Vector2D(444.9, 322.45), new Vector2D(436.73, 322.45)],
                [new Vector2D(640.82, 281.63), new Vector2D(648.98, 281.63), new Vector2D(648.98, 322.45), new Vector2D(640.82, 322.45)],
                [new Vector2D(0.0, 314.29), new Vector2D(69.39, 314.29), new Vector2D(69.39, 322.45), new Vector2D(0.0, 322.45)],
                [new Vector2D(77.55, 314.29), new Vector2D(118.37, 314.29), new Vector2D(118.37, 322.45), new Vector2D(77.55, 322.45)],
                [new Vector2D(159.18, 314.29), new Vector2D(200.0, 314.29), new Vector2D(200.0, 322.45), new Vector2D(159.18, 322.45)],
                [new Vector2D(363.27, 314.29), new Vector2D(404.08, 314.29), new Vector2D(404.08, 322.45), new Vector2D(363.27, 322.45)],
                [new Vector2D(444.9, 314.29), new Vector2D(526.53, 314.29), new Vector2D(526.53, 322.45), new Vector2D(444.9, 322.45)],
                [new Vector2D(567.35, 314.29), new Vector2D(608.16, 314.29), new Vector2D(608.16, 322.45), new Vector2D(567.35, 322.45)],
                [new Vector2D(681.63, 314.29), new Vector2D(763.27, 314.29), new Vector2D(763.27, 322.45), new Vector2D(681.63, 322.45)],
                [new Vector2D(191.84, 322.45), new Vector2D(200.0, 322.45), new Vector2D(200.0, 363.27), new Vector2D(191.84, 363.27)],
                [new Vector2D(395.92, 322.45), new Vector2D(404.08, 322.45), new Vector2D(404.08, 363.27), new Vector2D(395.92, 363.27)],
                [new Vector2D(477.55, 322.45), new Vector2D(485.71, 322.45), new Vector2D(485.71, 404.08), new Vector2D(477.55, 404.08)],
                [new Vector2D(518.37, 322.45), new Vector2D(526.53, 322.45), new Vector2D(526.53, 363.27), new Vector2D(518.37, 363.27)],
                [new Vector2D(600.0, 322.45), new Vector2D(608.16, 322.45), new Vector2D(608.16, 363.27), new Vector2D(600.0, 363.27)],
                [new Vector2D(681.63, 322.45), new Vector2D(689.8, 322.45), new Vector2D(689.8, 404.08), new Vector2D(681.63, 404.08)],
                [new Vector2D(28.57, 355.1), new Vector2D(151.02, 355.1), new Vector2D(151.02, 363.27), new Vector2D(28.57, 363.27)],
                [new Vector2D(281.63, 355.1), new Vector2D(363.27, 355.1), new Vector2D(363.27, 363.27), new Vector2D(281.63, 363.27)],
                [new Vector2D(404.08, 355.1), new Vector2D(444.9, 355.1), new Vector2D(444.9, 363.27), new Vector2D(404.08, 363.27)],
                [new Vector2D(526.53, 355.1), new Vector2D(567.35, 355.1), new Vector2D(567.35, 363.27), new Vector2D(526.53, 363.27)],
                [new Vector2D(608.16, 355.1), new Vector2D(681.63, 355.1), new Vector2D(681.63, 363.27), new Vector2D(608.16, 363.27)],
                [new Vector2D(722.45, 355.1), new Vector2D(800.0, 355.1), new Vector2D(800.0, 363.27), new Vector2D(722.45, 363.27)],
                [new Vector2D(28.57, 363.27), new Vector2D(36.73, 363.27), new Vector2D(36.73, 444.9), new Vector2D(28.57, 444.9)],
                [new Vector2D(355.1, 363.27), new Vector2D(363.27, 363.27), new Vector2D(363.27, 444.9), new Vector2D(355.1, 444.9)],
                [new Vector2D(559.18, 363.27), new Vector2D(567.35, 363.27), new Vector2D(567.35, 404.08), new Vector2D(559.18, 404.08)],
                [new Vector2D(722.45, 363.27), new Vector2D(730.61, 363.27), new Vector2D(730.61, 526.53), new Vector2D(722.45, 526.53)],
                [new Vector2D(36.73, 395.92), new Vector2D(118.37, 395.92), new Vector2D(118.37, 404.08), new Vector2D(36.73, 404.08)],
                [new Vector2D(191.84, 395.92), new Vector2D(232.65, 395.92), new Vector2D(232.65, 404.08), new Vector2D(191.84, 404.08)],
                [new Vector2D(273.47, 395.92), new Vector2D(322.45, 395.92), new Vector2D(322.45, 404.08), new Vector2D(273.47, 404.08)],
                [new Vector2D(363.27, 395.92), new Vector2D(477.55, 395.92), new Vector2D(477.55, 404.08), new Vector2D(363.27, 404.08)],
                [new Vector2D(518.37, 395.92), new Vector2D(559.18, 395.92), new Vector2D(559.18, 404.08), new Vector2D(518.37, 404.08)],
                [new Vector2D(600.0, 395.92), new Vector2D(681.63, 395.92), new Vector2D(681.63, 404.08), new Vector2D(600.0, 404.08)],
                [new Vector2D(730.61, 395.92), new Vector2D(771.43, 395.92), new Vector2D(771.43, 404.08), new Vector2D(730.61, 404.08)],
                [new Vector2D(110.2, 404.08), new Vector2D(118.37, 404.08), new Vector2D(118.37, 730.61), new Vector2D(110.2, 730.61)],
                [new Vector2D(191.84, 404.08), new Vector2D(200.0, 404.08), new Vector2D(200.0, 444.9), new Vector2D(191.84, 444.9)],
                [new Vector2D(273.47, 404.08), new Vector2D(281.63, 404.08), new Vector2D(281.63, 567.35), new Vector2D(273.47, 567.35)],
                [new Vector2D(436.73, 404.08), new Vector2D(444.9, 404.08), new Vector2D(444.9, 485.71), new Vector2D(436.73, 485.71)],
                [new Vector2D(600.0, 404.08), new Vector2D(608.16, 404.08), new Vector2D(608.16, 485.71), new Vector2D(600.0, 485.71)],
                [new Vector2D(69.39, 436.73), new Vector2D(77.55, 436.73), new Vector2D(77.55, 567.35), new Vector2D(69.39, 567.35)],
                [new Vector2D(151.02, 436.73), new Vector2D(191.84, 436.73), new Vector2D(191.84, 444.9), new Vector2D(151.02, 444.9)],
                [new Vector2D(200.0, 436.73), new Vector2D(240.82, 436.73), new Vector2D(240.82, 444.9), new Vector2D(200.0, 444.9)],
                [new Vector2D(314.29, 436.73), new Vector2D(355.1, 436.73), new Vector2D(355.1, 444.9), new Vector2D(314.29, 444.9)],
                [new Vector2D(363.27, 436.73), new Vector2D(404.08, 436.73), new Vector2D(404.08, 444.9), new Vector2D(363.27, 444.9)],
                [new Vector2D(477.55, 436.73), new Vector2D(600.0, 436.73), new Vector2D(600.0, 444.9), new Vector2D(477.55, 444.9)],
                [new Vector2D(640.82, 436.73), new Vector2D(722.45, 436.73), new Vector2D(722.45, 444.9), new Vector2D(640.82, 444.9)],
                [new Vector2D(763.27, 436.73), new Vector2D(771.43, 436.73), new Vector2D(771.43, 485.71), new Vector2D(763.27, 485.71)],
                [new Vector2D(232.65, 444.9), new Vector2D(240.82, 444.9), new Vector2D(240.82, 485.71), new Vector2D(232.65, 485.71)],
                [new Vector2D(314.29, 444.9), new Vector2D(322.45, 444.9), new Vector2D(322.45, 608.16), new Vector2D(314.29, 608.16)],
                [new Vector2D(518.37, 444.9), new Vector2D(526.53, 444.9), new Vector2D(526.53, 648.98), new Vector2D(518.37, 648.98)],
                [new Vector2D(28.57, 477.55), new Vector2D(69.39, 477.55), new Vector2D(69.39, 485.71), new Vector2D(28.57, 485.71)],
                [new Vector2D(118.37, 477.55), new Vector2D(200.0, 477.55), new Vector2D(200.0, 485.71), new Vector2D(118.37, 485.71)],
                [new Vector2D(240.82, 477.55), new Vector2D(273.47, 477.55), new Vector2D(273.47, 485.71), new Vector2D(240.82, 485.71)],
                [new Vector2D(355.1, 477.55), new Vector2D(436.73, 477.55), new Vector2D(436.73, 485.71), new Vector2D(355.1, 485.71)],
                [new Vector2D(444.9, 477.55), new Vector2D(485.71, 477.55), new Vector2D(485.71, 485.71), new Vector2D(444.9, 485.71)],
                [new Vector2D(559.18, 477.55), new Vector2D(600.0, 477.55), new Vector2D(600.0, 485.71), new Vector2D(559.18, 485.71)],
                [new Vector2D(608.16, 477.55), new Vector2D(689.8, 477.55), new Vector2D(689.8, 485.71), new Vector2D(608.16, 485.71)],
                [new Vector2D(771.43, 477.55), new Vector2D(800.0, 477.55), new Vector2D(800.0, 485.71), new Vector2D(771.43, 485.71)],
                [new Vector2D(28.57, 485.71), new Vector2D(36.73, 485.71), new Vector2D(36.73, 526.53), new Vector2D(28.57, 526.53)],
                [new Vector2D(191.84, 485.71), new Vector2D(200.0, 485.71), new Vector2D(200.0, 526.53), new Vector2D(191.84, 526.53)],
                [new Vector2D(477.55, 485.71), new Vector2D(485.71, 485.71), new Vector2D(485.71, 648.98), new Vector2D(477.55, 648.98)],
                [new Vector2D(640.82, 485.71), new Vector2D(648.98, 485.71), new Vector2D(648.98, 608.16), new Vector2D(640.82, 608.16)],
                [new Vector2D(151.02, 518.37), new Vector2D(159.18, 518.37), new Vector2D(159.18, 608.16), new Vector2D(151.02, 608.16)],
                [new Vector2D(200.0, 518.37), new Vector2D(240.82, 518.37), new Vector2D(240.82, 526.53), new Vector2D(200.0, 526.53)],
                [new Vector2D(355.1, 518.37), new Vector2D(444.9, 518.37), new Vector2D(444.9, 526.53), new Vector2D(355.1, 526.53)],
                [new Vector2D(559.18, 518.37), new Vector2D(567.35, 518.37), new Vector2D(567.35, 648.98), new Vector2D(559.18, 648.98)],
                [new Vector2D(600.0, 518.37), new Vector2D(608.16, 518.37), new Vector2D(608.16, 567.35), new Vector2D(600.0, 567.35)],
                [new Vector2D(681.63, 518.37), new Vector2D(722.45, 518.37), new Vector2D(722.45, 526.53), new Vector2D(681.63, 526.53)],
                [new Vector2D(730.61, 518.37), new Vector2D(771.43, 518.37), new Vector2D(771.43, 526.53), new Vector2D(730.61, 526.53)],
                [new Vector2D(232.65, 526.53), new Vector2D(240.82, 526.53), new Vector2D(240.82, 567.35), new Vector2D(232.65, 567.35)],
                [new Vector2D(355.1, 526.53), new Vector2D(363.27, 526.53), new Vector2D(363.27, 608.16), new Vector2D(355.1, 608.16)],
                [new Vector2D(436.73, 526.53), new Vector2D(444.9, 526.53), new Vector2D(444.9, 567.35), new Vector2D(436.73, 567.35)],
                [new Vector2D(681.63, 526.53), new Vector2D(689.8, 526.53), new Vector2D(689.8, 567.35), new Vector2D(681.63, 567.35)],
                [new Vector2D(28.57, 559.18), new Vector2D(69.39, 559.18), new Vector2D(69.39, 567.35), new Vector2D(28.57, 567.35)],
                [new Vector2D(191.84, 559.18), new Vector2D(232.65, 559.18), new Vector2D(232.65, 567.35), new Vector2D(191.84, 567.35)],
                [new Vector2D(395.92, 559.18), new Vector2D(436.73, 559.18), new Vector2D(436.73, 567.35), new Vector2D(395.92, 567.35)],
                [new Vector2D(608.16, 559.18), new Vector2D(640.82, 559.18), new Vector2D(640.82, 567.35), new Vector2D(608.16, 567.35)],
                [new Vector2D(689.8, 559.18), new Vector2D(730.61, 559.18), new Vector2D(730.61, 567.35), new Vector2D(689.8, 567.35)],
                [new Vector2D(763.27, 559.18), new Vector2D(800.0, 559.18), new Vector2D(800.0, 567.35), new Vector2D(763.27, 567.35)],
                [new Vector2D(28.57, 567.35), new Vector2D(36.73, 567.35), new Vector2D(36.73, 608.16), new Vector2D(28.57, 608.16)],
                [new Vector2D(395.92, 567.35), new Vector2D(404.08, 567.35), new Vector2D(404.08, 730.61), new Vector2D(395.92, 730.61)],
                [new Vector2D(722.45, 567.35), new Vector2D(730.61, 567.35), new Vector2D(730.61, 689.8), new Vector2D(722.45, 689.8)],
                [new Vector2D(0.0, 600.0), new Vector2D(28.57, 600.0), new Vector2D(28.57, 608.16), new Vector2D(0.0, 608.16)],
                [new Vector2D(69.39, 600.0), new Vector2D(77.55, 600.0), new Vector2D(77.55, 730.61), new Vector2D(69.39, 730.61)],
                [new Vector2D(118.37, 600.0), new Vector2D(151.02, 600.0), new Vector2D(151.02, 608.16), new Vector2D(118.37, 608.16)],
                [new Vector2D(159.18, 600.0), new Vector2D(314.29, 600.0), new Vector2D(314.29, 608.16), new Vector2D(159.18, 608.16)],
                [new Vector2D(436.73, 600.0), new Vector2D(444.9, 600.0), new Vector2D(444.9, 648.98), new Vector2D(436.73, 648.98)],
                [new Vector2D(567.35, 600.0), new Vector2D(608.16, 600.0), new Vector2D(608.16, 608.16), new Vector2D(567.35, 608.16)],
                [new Vector2D(648.98, 600.0), new Vector2D(689.8, 600.0), new Vector2D(689.8, 608.16), new Vector2D(648.98, 608.16)],
                [new Vector2D(730.61, 600.0), new Vector2D(771.43, 600.0), new Vector2D(771.43, 608.16), new Vector2D(730.61, 608.16)],
                [new Vector2D(191.84, 608.16), new Vector2D(200.0, 608.16), new Vector2D(200.0, 648.98), new Vector2D(191.84, 648.98)],
                [new Vector2D(273.47, 608.16), new Vector2D(281.63, 608.16), new Vector2D(281.63, 648.98), new Vector2D(273.47, 648.98)],
                [new Vector2D(681.63, 608.16), new Vector2D(689.8, 608.16), new Vector2D(689.8, 648.98), new Vector2D(681.63, 648.98)],
                [new Vector2D(28.57, 640.82), new Vector2D(69.39, 640.82), new Vector2D(69.39, 648.98), new Vector2D(28.57, 648.98)],
                [new Vector2D(151.02, 640.82), new Vector2D(159.18, 640.82), new Vector2D(159.18, 771.43), new Vector2D(151.02, 771.43)],
                [new Vector2D(232.65, 640.82), new Vector2D(240.82, 640.82), new Vector2D(240.82, 689.8), new Vector2D(232.65, 689.8)],
                [new Vector2D(281.63, 640.82), new Vector2D(395.92, 640.82), new Vector2D(395.92, 648.98), new Vector2D(281.63, 648.98)],
                [new Vector2D(444.9, 640.82), new Vector2D(477.55, 640.82), new Vector2D(477.55, 648.98), new Vector2D(444.9, 648.98)],
                [new Vector2D(526.53, 640.82), new Vector2D(559.18, 640.82), new Vector2D(559.18, 648.98), new Vector2D(526.53, 648.98)],
                [new Vector2D(600.0, 640.82), new Vector2D(608.16, 640.82), new Vector2D(608.16, 771.43), new Vector2D(600.0, 771.43)],
                [new Vector2D(640.82, 640.82), new Vector2D(681.63, 640.82), new Vector2D(681.63, 648.98), new Vector2D(640.82, 648.98)],
                [new Vector2D(763.27, 640.82), new Vector2D(771.43, 640.82), new Vector2D(771.43, 800.0), new Vector2D(763.27, 800.0)],
                [new Vector2D(640.82, 648.98), new Vector2D(648.98, 648.98), new Vector2D(648.98, 689.8), new Vector2D(640.82, 689.8)],
                [new Vector2D(0.0, 681.63), new Vector2D(36.73, 681.63), new Vector2D(36.73, 689.8), new Vector2D(0.0, 689.8)],
                [new Vector2D(159.18, 681.63), new Vector2D(232.65, 681.63), new Vector2D(232.65, 689.8), new Vector2D(159.18, 689.8)],
                [new Vector2D(240.82, 681.63), new Vector2D(363.27, 681.63), new Vector2D(363.27, 689.8), new Vector2D(240.82, 689.8)],
                [new Vector2D(436.73, 681.63), new Vector2D(567.35, 681.63), new Vector2D(567.35, 689.8), new Vector2D(436.73, 689.8)],
                [new Vector2D(608.16, 681.63), new Vector2D(640.82, 681.63), new Vector2D(640.82, 689.8), new Vector2D(608.16, 689.8)],
                [new Vector2D(681.63, 681.63), new Vector2D(722.45, 681.63), new Vector2D(722.45, 689.8), new Vector2D(681.63, 689.8)],
                [new Vector2D(314.29, 689.8), new Vector2D(322.45, 689.8), new Vector2D(322.45, 800.0), new Vector2D(314.29, 800.0)],
                [new Vector2D(436.73, 689.8), new Vector2D(444.9, 689.8), new Vector2D(444.9, 771.43), new Vector2D(436.73, 771.43)],
                [new Vector2D(559.18, 689.8), new Vector2D(567.35, 689.8), new Vector2D(567.35, 730.61), new Vector2D(559.18, 730.61)],
                [new Vector2D(681.63, 689.8), new Vector2D(689.8, 689.8), new Vector2D(689.8, 771.43), new Vector2D(681.63, 771.43)],
                [new Vector2D(28.57, 722.45), new Vector2D(69.39, 722.45), new Vector2D(69.39, 730.61), new Vector2D(28.57, 730.61)],
                [new Vector2D(77.55, 722.45), new Vector2D(110.2, 722.45), new Vector2D(110.2, 730.61), new Vector2D(77.55, 730.61)],
                [new Vector2D(159.18, 722.45), new Vector2D(200.0, 722.45), new Vector2D(200.0, 730.61), new Vector2D(159.18, 730.61)],
                [new Vector2D(232.65, 722.45), new Vector2D(281.63, 722.45), new Vector2D(281.63, 730.61), new Vector2D(232.65, 730.61)],
                [new Vector2D(355.1, 722.45), new Vector2D(395.92, 722.45), new Vector2D(395.92, 730.61), new Vector2D(355.1, 730.61)],
                [new Vector2D(404.08, 722.45), new Vector2D(436.73, 722.45), new Vector2D(436.73, 730.61), new Vector2D(404.08, 730.61)],
                [new Vector2D(477.55, 722.45), new Vector2D(526.53, 722.45), new Vector2D(526.53, 730.61), new Vector2D(477.55, 730.61)],
                [new Vector2D(567.35, 722.45), new Vector2D(600.0, 722.45), new Vector2D(600.0, 730.61), new Vector2D(567.35, 730.61)],
                [new Vector2D(640.82, 722.45), new Vector2D(681.63, 722.45), new Vector2D(681.63, 730.61), new Vector2D(640.82, 730.61)],
                [new Vector2D(722.45, 722.45), new Vector2D(763.27, 722.45), new Vector2D(763.27, 730.61), new Vector2D(722.45, 730.61)],
                [new Vector2D(232.65, 730.61), new Vector2D(240.82, 730.61), new Vector2D(240.82, 771.43), new Vector2D(232.65, 771.43)],
                [new Vector2D(273.47, 730.61), new Vector2D(281.63, 730.61), new Vector2D(281.63, 771.43), new Vector2D(273.47, 771.43)],
                [new Vector2D(355.1, 730.61), new Vector2D(363.27, 730.61), new Vector2D(363.27, 771.43), new Vector2D(355.1, 771.43)],
                [new Vector2D(518.37, 730.61), new Vector2D(526.53, 730.61), new Vector2D(526.53, 771.43), new Vector2D(518.37, 771.43)],
                [new Vector2D(28.57, 763.27), new Vector2D(151.02, 763.27), new Vector2D(151.02, 771.43), new Vector2D(28.57, 771.43)],
                [new Vector2D(191.84, 763.27), new Vector2D(232.65, 763.27), new Vector2D(232.65, 771.43), new Vector2D(191.84, 771.43)],
                [new Vector2D(395.92, 763.27), new Vector2D(404.08, 763.27), new Vector2D(404.08, 800.0), new Vector2D(395.92, 800.0)],
                [new Vector2D(444.9, 763.27), new Vector2D(485.71, 763.27), new Vector2D(485.71, 771.43), new Vector2D(444.9, 771.43)],
                [new Vector2D(526.53, 763.27), new Vector2D(567.35, 763.27), new Vector2D(567.35, 771.43), new Vector2D(526.53, 771.43)],
                [new Vector2D(608.16, 763.27), new Vector2D(648.98, 763.27), new Vector2D(648.98, 771.43), new Vector2D(608.16, 771.43)],
                [new Vector2D(689.8, 763.27), new Vector2D(730.61, 763.27), new Vector2D(730.61, 771.43), new Vector2D(689.8, 771.43)],
                [new Vector2D(191.84, 771.43), new Vector2D(200.0, 771.43), new Vector2D(200.0, 800.0), new Vector2D(191.84, 800.0)],
                [new Vector2D(559.18, 771.43), new Vector2D(567.35, 771.43), new Vector2D(567.35, 800.0), new Vector2D(559.18, 800.0)],
            ];
        break;
    }
    updateGhost();
    $("level_display").innerText = `Level ${window.game.level}`;
    $("level_name_display").innerText = window.game.level_name;
}

function resetLevel() {
    button_start.style.backgroundImage = "url('https://pxlpkr.github.io/gravity-game/button_play.png')";

    loadLevel(window.game.level);

    window.game.bodies = window.game.bodies_copy;
    window.game.obstacles = window.game.obstacles;
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
    window.ghost.goal.pos = window.game.goal.pos.copy();

    window.ghost.bodies = [];
    for (const body of window.game.bodies) {
        window.ghost.bodies.push(cloneBody(body));
    }

    window.ghost.obstacles = [];
    for (const obst of window.game.obstacles) {
        let n = [];
        for (const p of obst) {
            n.push(p.copy());
        }
        window.ghost.obstacles.push(n);
    }

    window.ghost.g_const = window.game.g_const;
}

function updateGhost() {
    if (!window.game.opt.use_ghost)
        return;

    loadGhost();
    window.ghost.last.ship_positions = [];
    let o = simulate(window.ghost);
    for (let i = 0; o == 0 && i < window.game.opt.max_ghost_length; i++) {
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

    static goal = class {
        static pos = new Vector2D();
    }

    static obstacles;

    static bodies;

    static g_const;

    static last = class {
        static ship_positions = [];
    }
}

function changeLevel(amount) {
    if (amount == -1) {
        if (window.game.level == 2) {
            $("button_pagedown").style.visibility = "hidden";
        }
        if (window.game.level == window.game.max_level) {
            $("button_pageup").style.visibility = "";
        }
        window.game.level--;
    } else if (amount == 1) {
        if (window.game.level == 1) {
            $("button_pagedown").style.visibility = "";
        }
        if (window.game.level == window.game.max_level - 1) {
            $("button_pageup").style.visibility = "hidden";
        }
        window.game.level++;
    }
    $("button_pageup").classList.remove("pulsing_border");
    window.game.bodies = [];
    window.game.bodies_copy = [];
    resetLevel();
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

    let level_display = document.createElement("p");
    level_display.style = `position: absolute; left: ${size*0.08 + (width-size)/2 + 5*2}px; top: ${(height-size)/2 - size*0.08 - 5 + size*0.025}px; color: #ffffff; font-size: ${size*0.04}px; margin: 0px`;
    level_display.innerText = "Level 1";
    level_display.id = "level_display";
    body.appendChild(level_display);

    let level_name_display = document.createElement("p");
    level_name_display.style = `position: absolute; left: ${size*0.08*3 + (width-size)/2 + size*0.1}px; top: ${(height-size)/2 - size*0.04}px; color: #ffffff; font-size: ${size*0.03}px; margin: 0px`;
    level_name_display.innerText = "";
    level_name_display.id = "level_name_display";
    body.appendChild(level_name_display);

    let button_pageup = document.createElement("div");
    button_pageup.style = `position: absolute; width: ${size*0.04 - 2}px; height: ${size*0.04 - 2}px; left: ${size*0.08*2 + (width-size)/2 + size*0.1}px; top: ${(height-size)/2 - size*0.08 - 5}px; border-style: solid; border-width: 1px; border-color: #888888; background-size: ${size*0.04 - 2}px`;
    button_pageup.style.backgroundImage = "url('https://pxlpkr.github.io/gravity-game/button_pageup.png')";
    button_pageup.id = "button_pageup";
    button_pageup.addEventListener("click", (e) => {
        changeLevel(1);
    });
    body.appendChild(button_pageup);

    let button_pagedown = document.createElement("div");
    button_pagedown.style = `position: absolute; width: ${size*0.04 - 2}px; height: ${size*0.04 - 2}px; left: ${size*0.08*2 + (width-size)/2 + size*0.1}px; top: ${(height-size)/2 - size*0.08 - 5 + size*0.04 + 2}px; border-style: solid; border-width: 1px; border-color: #888888; background-size: ${size*0.04 - 2}px; visibility: hidden;`;
    button_pagedown.style.backgroundImage = "url('https://pxlpkr.github.io/gravity-game/button_pagedown.png')";
    button_pagedown.id = "button_pagedown";
    button_pagedown.addEventListener("click", (e) => {
        changeLevel(-1);
    });
    body.appendChild(button_pagedown);

    for (const id_ of getInfoBoxes()) {
        $(id_).addEventListener("click", (e) => {
            if (window.game.ship_dead) {
                resetLevel();
            }
            if (editsAllowed) {
                $(id_).select();
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
            $(id_).style.color = "#aaaaaa";
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
    } else if (window.game.sidebar.selected_id == -3) {
        $("info_position_x").value = window.game.goal.pos.x;
        $("info_position_y").value = window.game.goal.pos.y;
        $("info_velocity_x").value = "0";
        $("info_velocity_y").value = "0";
        $("info_radius").value = "0";
        $("info_density").value = "∞";
        $("body_preview").getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
        $("body_preview").getContext("2d").drawImage(blackhole_texture, 0, 0, $("body_preview").width, $("body_preview").height);
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

function win_level() {
    $("button_pageup").classList.add("pulsing_border");

    kill_ship();
    window.game.ship.pos = new Vector2D(-200, -200);
    window.game.anim_win = 240;
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

    //Into borders...
    if (env.ship.pos.x > 800 || env.ship.pos.y > 800 || env.ship.pos.x < 0 || env.ship.pos.y < 0) {
        return 1;
    }

    //Into bodies...
    for (const body of env.bodies) {
        let diff_x = Math.abs(env.ship.pos.x - body.pos.x);
        let diff_y = Math.abs(env.ship.pos.y - body.pos.y);

        if (Math.sqrt(diff_x * diff_x + diff_y * diff_y) < body.radius) {
            return 1;
        }
    }

    //Into obstacles...
    for (const obstacle of env.obstacles) {
        for (let i = 0; i < obstacle.length; i++) {
            let pt_1 = obstacle[i];
            let pt_2 = obstacle[0];
            if (i != obstacle.length - 1) {
                pt_2 = obstacle[i+1];
            }

            function helper(a, b, c) {
                return (c.y-a.y) * (b.x-a.x) > (b.y-a.y) * (c.x-a.x);
            }

            if (helper(pt_1,env.ship.old_pos,env.ship.pos) != helper(pt_2,env.ship.old_pos,env.ship.pos) &&
                helper(pt_1,pt_2,env.ship.old_pos) != helper(pt_1,pt_2,env.ship.pos)) {
                return 1;
            }
        }
    }

    // Check if ship reaches goal
    if (new Vector2D(env.ship.pos.x - env.goal.pos.x, env.ship.pos.y - env.goal.pos.y).magnitude < 25) {
        return 2;
    }

    return 0;
}

function drawImageAround(texture, real_loc, real_size, alpha) {
    let ctx = $("canvas").getContext("2d");
    if (alpha != undefined) {
        ctx.globalAlpha = alpha;
    } else {
        ctx.globalAlpha = 1;
    }
    let loc = real_loc.transform();
    let size = real_size.transform();
    ctx.drawImage(texture,
        loc.x-size.x/2, loc.y-size.y/2, size.x, size.y
    );
    ctx.globalAlpha = 1;
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
        let sim_result = simulate(window.game);
        if (sim_result == 1) {
            kill_ship();
        } else if (sim_result == 2) {
            win_level();
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

    // Draw tutorial
    if (window.game.level == 1) {
        drawImageAround(tutorial_splash_texture, new Vector2D(400, 400), new Vector2D(800, 800), 0.6);
    }

    // Draw obstacles
    for (const obstacle of window.game.obstacles) {
        if (obstacle.length == 0)
            continue;

        ctx.beginPath();
        ctx.moveTo(obstacle[0].transform().x, obstacle[0].transform().y);
        for (let i = 1; i < obstacle.length; i++) {
            ctx.lineTo(obstacle[i].transform().x, obstacle[i].transform().y);
        }
        ctx.lineTo(obstacle[0].transform().x, obstacle[0].transform().y);

        ctx.lineWidth = 2;
        ctx.strokeStyle = "#ff0000ff";
        ctx.stroke();

        ctx.fillStyle = "#ff000055";
        ctx.fill();
    }

    // Draw every planet
    for (const body of window.game.bodies) {
        drawCircleAround(body.color, body.pos, body.radius, true);
    }

    // Draw circle user is currently adding
    if (window.game.new_circle.center != undefined) {
        drawCircleAround("#ffffff", window.game.new_circle.center, window.game.new_circle.radius, false);
        drawLine("#ffffff", window.game.new_circle.center, window.game.mouse.real);
    }

    // Draw goal
    drawImageAround(end_texture, window.game.goal.pos, new Vector2D(100, 100));

    // Draw trajectory
    if (editsAllowed()) {
        for (const pt of window.ghost.last.ship_positions) {
            drawCircleAround("#ffffff88", pt, 2, true);
        }
    }

    // Draw ship
    if (window.game.ship_dead) {
        drawImageAround(explosion_texture, window.game.ship.pos, new Vector2D(100, 100));
    } else {
        window.game.anim_ship_blink = (window.game.anim_ship_blink + 1) % 60;
        if (window.game.anim_ship_blink < 30 || window.game.is_simulating) {
            drawImageAround(ship_texture, window.game.ship.pos, new Vector2D(100, 100));
        }
    }

    // Draw axis
    ctx.drawImage(axis_texture, 5, 5);

    // Draw win splash
    if (window.game.anim_win > 0) {
        drawImageAround(win_splash_texture, new Vector2D(400, 400), new Vector2D(600, 600), window.game.anim_win / 240);
        window.game.anim_win--;
    }
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
    window.game.sidebar.selected_id = window.game.bodies.length - 1;

    window.game.new_circle.center = undefined;
    window.game.new_circle.radius = undefined;

    updateGhost();
    updateInfoBoxes();
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

        if (Math.abs(window.game.goal.pos.x - window.game.mouse.x) < 25 && Math.abs(window.game.goal.pos.y - window.game.mouse.y) < 25) {
            window.game.sidebar.selected_id = -3;
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

    document.addEventListener("keydown", (e) => {
        if (e.key == "Shift") {
            window.game.shift_down = true;
        } else if (e.key == "Backspace") {
            if (document.activeElement == document.body)
                deleteCurrentBody();
        }
     });

    document.addEventListener("keyup", (e) => {
        if (e.key == "Shift") {
            window.game.shift_down = false;
        }
    });

    $("canvas").addEventListener("mousemove", (e) => {
        let mouse_x = (e.layerX / e.target.getBoundingClientRect().width) * 800;
        let mouse_y = (e.layerY / e.target.getBoundingClientRect().height) * 800;

        window.game.mouse.real = new Vector2D(mouse_x, mouse_y);

        let diff = new Vector2D(mouse_x - window.game.mouse.x, mouse_y - window.game.mouse.y);

        if (window.game.shift_down) {
            diff = diff.div(5);
        }

        if (editsAllowed()) {
            if (window.game.mouse.o_drag_id != undefined) {
                let body = window.game.bodies[window.game.mouse.o_drag_id];
                let x_diff = diff.x;
                let y_diff = diff.y;
                if (diff.magnitude < 5 && !window.game.shift_down) {
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