
try {
let name1=""
let name2=""

let floors = [];
let keys = [];

const gravity = 0.0001
const jumpSpeed = 0.005
const moveSpeed = 0.0003
const damageFactor = 100000
const speedThresh = 0.00008
const untouchFactor = 0.001

const sprite1 = new Image()
sprite1.src = './assets/player1.png'
const sprite2 = new Image()
sprite2.src = './assets/player2.png'
const hitSound = new Audio('./assets/punch.mp3')

const music = document.getElementById("music")
const toggleBtn = document.getElementById("toggle-btn");
const overlay = document.getElementById("overlay")
const closeBtn = document.getElementById("change-screen")
const namesForm = document.getElementById('names-form');
const player1Input = namesForm.querySelector('#player1');
const player2Input = namesForm.querySelector('#player2');
const refreshBtn = document.getElementById('refresh-btn');

let isPlaying = false;

toggleBtn.addEventListener("click", function() {
  if (!isPlaying) {
    music.play()
    isPlaying = true
    toggleBtn.innerText = "Pause music"
  } else {
    music.pause()
    isPlaying = false
    toggleBtn.innerText = "Play music"
  }
});

music.addEventListener("ended", function() {
  isPlaying = false
  toggleBtn.innerText = "Play music"
})

namesForm.addEventListener('submit', (event) => {
    event.preventDefault()
  
    name1 = player1Input.value.trim();
    name2 = player2Input.value.trim();
  
    if (name1 != '' && name2 != '') {
      overlay.style.display = 'none'
      document.getElementById("entry").innerText = "WASD :"+name1 + " V/S " + name2 + ": Arrow keys"
    }
  });

refreshBtn.addEventListener('click', function(){
    location.reload()
})

player1Input.addEventListener('input', updateButton);
player2Input.addEventListener('input', updateButton);

function updateButton() {
    name1 = player1Input.value.trim();
    name2 = player2Input.value.trim();

    closeBtn.disabled = (name1 === '') || (name2 === '')
}

// all rectangles are stored as (x, y, width, height)
// all circles are stored as (x, y, r)
// y_max is 0.5625

function gaussian(stdev=1) {
    let u = 1 - Math.random()
    let v = Math.random()
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v )
    return z * stdev;
}

function rotate(vx, vy, theta) {
    return {x : vx * Math.cos(theta) - vy * Math.sin(theta),
            y : vx * Math.sin(theta) + vy * Math.cos(theta)}
}


window.addEventListener("keydown",
    function(e){
        keys[e.key] = overlay.style.display == 'none'
    },
false)

window.addEventListener('keyup',
    function(e){
        keys[e.key] = false
    },
false)

const clip = (num, min, max) => Math.min(Math.max(num, min), max);

function drawText(text, x, y, colour){
    ctx.font = Math.round(canvas_width*0.07) + "px Century Gothic"
    ctx.lineWidth = Math.round(canvas_width*0.01);
    ctx.textAlign = "center"

    ctx.strokeStyle = "black"
    ctx.fillStyle = colour
    ctx.strokeText(text, canvas_width*x, canvas_height*y)
    ctx.fillText(text, canvas_width*x, canvas_height*y)
}

function inter_c_c(circ1, circ2) {
    // returns <intersecting?>, <unit_x direction>, <unit_y direction>
    let x = circ1.x-circ2.x;
    let y = circ1.y-circ2.y;
    let dist = x**2 + y**2
    return [dist <= (circ1.radius+circ2.radius)**2, x, y]

}

function inter_c_r(circ, rect) {
    // returns <intersecting?>, <direction_x=-1 or 0 or 1>, <direction_y=-1 or 0 or 1>
    // direction represents relative direction circle should "bounce" towards to negate collision
    // direction functionality is not working yet
    
    let x = (circ.x - rect.x);
    let y = (circ.y - rect.y);
    let colliding = false;
    let direction_x = 0;
    let direction_y = 0;

    if (Math.abs(x) > rect.width/2 + circ.radius)  { return [false, 0, 0] }
    if (Math.abs(y) > rect.height/2 + circ.radius) { return [false, 0, 0] }

    cornerDist = (Math.abs(x) - rect.width/2)**2 + (Math.abs(y) - rect.height/2)**2;
    
    if (circ.radius > Math.abs(x-rect.width/2)){
        direction_x = 1
    } else if (circ.radius > Math.abs(x+rect.width/2)){
        direction_x = -1
    }

    if (circ.radius > Math.abs(y-rect.height/2)){
        direction_y = 1
    } else if (circ.radius > Math.abs(y+rect.height/2)){
        direction_y = -1
    }

    if (Math.abs(x) <= rect.width/2){
        colliding=true
        direction_x=0
    } 

    if (Math.abs(y) <= rect.height/2){
        colliding=true
        direction_y=0
    }

    return [(cornerDist <= circ.radius**2) || colliding, direction_x, direction_y]
}

function c_c_elastic(circ1, circ2){
    let e = 0.7

    let m1 = circ1.mass
    let m2 = circ2.mass
    let theta = -Math.atan2(circ2.y - circ1.y, circ2.x - circ1.x);
    let v1 = rotate(circ1.speedx, circ1.speedy, theta);
    let v2 = rotate(circ2.speedx, circ2.speedy, theta);
    let u1 = rotate(v1.x * (m1 - e*m2)/(m1 + m2) + v2.x * (1+e) * m2/(m1 + m2), v1.y, -theta);
    let u2 = rotate(v2.x * (m2 - e*m1)/(m1 + m2) + v1.x * (1+e) * m1/(m1 + m2), v2.y, -theta);
    
    circ1.speedx = u1.x
    circ1.speedy = u1.y
    circ2.speedx = u2.x
    circ2.speedy = u2.y
}

function startGame() {
    myGameArea.start()
    ctx = myGameArea.context

    player1 = new Player(0.35, 0.2, sprite1, 'a', 'd', 'w', 's', 0.2);
    player2 = new Player(0.8, 0.2, sprite2, 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 0.8);

    floors.push(new Floor(0.2, 0.43, 0.9, 0.46))
    floors.push(new Floor(0.7, 0.3, 0.9, 0.33))

    floors.push(new Floor(0.1, 0.2, 0.25, 0.23))
    floors.push(new Floor(0.3, 0.3, 0.38, 0.33))
    floors.push(new Floor(0.45, 0.15, 0.55, 0.18))
    
    const border = 0.02
    floors.push(new Floor(-0.1      , -0.1           , 1.1       , 0 + border))
    floors.push(new Floor(-0.1      , 0.5625 - border, 1.1       , 0.6625    ))
    floors.push(new Floor(-0.1      , -0.1           , 0 + border, 0.6625    ))
    floors.push(new Floor(1 - border, -0.1           , 1.1       , 0.6625    ))

    floorImg = new Image()
    floorImg.src = './assets/brick.png'

    quakeX = 0
    quakeY = 0
}

let myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        canvas_width = window.screen.width*0.7;
        canvas_height = canvas_width * 9/16;

        this.canvas.width = canvas_width
        this.canvas.height = canvas_height

        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.frameNo = 0;
        this.interval = setInterval(updateGameArea, 20);
        },
    clear : function() {
        this.context.clearRect(0, 0, canvas_width, canvas_height);
    }
}

function Floor(x1, y1, x2, y2){
    this.x1 = x1
    this.y1 = y1
    this.x2 = x2
    this.y2 = y2
    this.x = (x1+x2)/2
    this.y = (y1+y2)/2
    this.width = x2-x1
    this.height = y2-y1

    this.render = function() {
        ctx.fillStyle = ctx.createPattern(floorImg, "repeat");

        ctx.beginPath()
        ctx.roundRect(canvas_width*this.x1,
                     canvas_width*this.y1,
                     canvas_width*(this.x2-this.x1),
                     canvas_width*(this.y2-this.y1),
                     canvas_width*0.005)
        ctx.fill()
    }
}

function Player(x, y, sprite, leftKey, rightKey, upKey, downKey, healthX) {
    this.ammo = 0
    this.x = x
    this.y = y
    this.radius = 0.02
    this.sprite = sprite
    this.speedx = 0
    this.speedy = 0
    this.health = 1
    this.mass = 1

    this.leftKey  = leftKey
    this.rightKey = rightKey
    this.upKey    = upKey
    this.downKey  = downKey

    this.healthX = healthX
    this.healthY = 0.05
    this.healthWidth  = 0.2
    this.healthHeight = 0.02

    gradient = ctx.createLinearGradient((this.healthX-this.healthWidth/2)*canvas_width,
                                        (this.healthY-this.healthHeight*3)*canvas_width,
                                        (this.healthX+this.healthWidth/2)*canvas_width,
                                        (this.healthY+this.healthHeight*3)*canvas_width)

    gradient.addColorStop(0  , "#ff0000")
    gradient.addColorStop(0.5, "#f9ff00")
    gradient.addColorStop(1  , "#12ff00")

    this.gradient = gradient

    this.render = function(colour) {
        ctx.save()

        ctx.translate(this.x*canvas_width, this.y*canvas_width)

        let theta = this.x/this.radius
        ctx.rotate(theta);

        ctx.drawImage(
            this.sprite,
            -this.radius*canvas_width,
            -this.radius*canvas_width,
            this.radius*canvas_width*2,
            this.radius*canvas_width*2
        )
        ctx.restore()

        ctx.strokeStyle = colour
        ctx.fillStyle = this.gradient
        ctx.beginPath()

        ctx.lineWidth = Math.round(canvas_width*0.005);

        ctx.roundRect((this.healthX-this.healthWidth/2)*canvas_width,
                      (this.healthY-this.healthHeight/2)*canvas_width,
                      this.healthWidth*canvas_width*this.health,
                      this.healthHeight*canvas_width,
                      this.healthHeight*canvas_width/2)
                     
        ctx.stroke()
        ctx.fill()

    }
    this.move = function() {
        maxSpeed = 0.01
        
        this.speedy = gravity + this.speedy
        this.speedy = clip(this.speedy, -maxSpeed, maxSpeed)
        this.speedx = clip(this.speedx, -maxSpeed, maxSpeed)
        this.speedx *= 0.98

        this.x += this.speedx
        this.y += this.speedy
    }
}


function updateGameArea() {
    var colliding, direction_x, direction_y, jumping
    myGameArea.clear();
    myGameArea.frameNo += 1;

    [player1, player2].forEach(player => {
        jumping = false
        floors.forEach(floor => {
            
            [colliding, direction_x, direction_y] = inter_c_r(player, floor)
            if (colliding){
                if (direction_y){
                    do {
                        player.y += direction_y*0.001
                    } while (inter_c_r(player, floor)[0])
                    if (player.speedy**2>speedThresh){
                        
                        player.health -= damageFactor * Math.abs(player.speedy)**3 * 1.5  // *1.5 becasue wall hurts more :(
                        hitSound.play()    
                    }
                    player.speedy = 0
                }
                if (direction_x){
                    do {
                        player.x += direction_x*0.001
                    } while (inter_c_r(player, floor)[0])

                    if (player.speedx**2>speedThresh){
                        player.health -= damageFactor * Math.abs(player.speedx)**3 * 1.5 // *1.5 becasue wall hurts more :(
                        hitSound.play()    
                    }
                    player.speedx = 0
                }
                if (direction_y<0 && keys[player.upKey]){
                    jumping = true;
                }
            }
        })


        if (jumping){
            player.speedy=-jumpSpeed
        }
        if (keys[player.leftKey]){
            player.speedx-=moveSpeed
        }
        if (keys[player.rightKey]){
            player.speedx+=moveSpeed
        }
        if (keys[player.downKey]){
            player.speedy+=1.5*moveSpeed 
        }

        player.move()

        var factor = (2**Math.abs(player.speedx) + 2**Math.abs(player.speedy) - 2)
        //add a minimum clip
        factor *= factor > (moveSpeed*20)
        quakeX += gaussian(0.2) * factor
        quakeY += gaussian(0.2) * factor
    })
    
    var [colliding, direction_x, direction_y]  = inter_c_c(player1,player2)


    if (colliding){

        var relSpeed = (player1.speedx - player2.speedx)**2 + (player1.speedy - player2.speedy)**2
        if (relSpeed>speedThresh){
            speed1 = (player1.speedx**2 + player1.speedy**2)**0.5
            speed2 = (player2.speedx**2 + player2.speedy**2)**0.5

            player1.health -= damageFactor * speed2 * relSpeed * player2.mass
            player2.health -= damageFactor * speed1 * relSpeed * player1.mass

            hitSound.play()

        }

        c_c_elastic(player1, player2)

        do {
            player1.x += direction_x*untouchFactor
            player1.y += direction_y*untouchFactor
            player2.x -= direction_x*untouchFactor
            player2.y -= direction_y*untouchFactor
        } while (inter_c_c(player1,player2)[0])
    }
    
    if (player1.health<=0 || player2.health<=0){
        player1.health = clip(player1.health, 0, 1)
        player2.health = clip(player2.health, 0, 1)
        drawText("GAME OVER!", 0.5, 0.45, "white")

        if (player1.health<=0 && player2.health<=0){
            drawText("It's a tie :)", 0.5, 0.93, "#e699ff")
        } else if (player1.health<=0){
            drawText("Blue wins!", 0.5, 0.93, "#99ccff")
        } else{
            drawText("Red wins!", 0.5, 0.93, "#ff6699")
        }

        

        clearInterval(myGameArea.interval)
    }

    // RENDER THINGS

    ctx.save()
    ctx.translate(canvas_width*quakeX, canvas_width*quakeY)
    player1.render("#ff6699")
    player2.render("#99ccff")

    floors.forEach(floor => {
        floor.render()
    })
    ctx.restore()

    // STOP RENDERING THINGS

    quakeX *= 0.9
    quakeY *= 0.9
}

} catch (error) {
    console.error(error);
}