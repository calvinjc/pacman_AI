//////////////////////////////////////////////////////////////////////////////////////
// Player is the controllable character (Pac-Man)

// Player constructor
var Player = function() {

    // inherit data from Actor
    Actor.apply(this);
    if (gameMode == GAME_MSPACMAN || gameMode == GAME_COOKIE) {
        this.frames = 1; // start with mouth open
    }

    this.nextDir = {};

    // determines if this player should be AI controlled
    this.ai = true;
    this.invincible = false;

    this.savedNextDirEnum = {};
    this.savedStopped = {};
    this.savedEatPauseFramesLeft = {};

    this.prevBestRoute = { dirEnum: 0, distance: 0, dots: 0, energizer: 0, value: 0};
};

// inherit functions from Actor
Player.prototype = newChildObject(Actor.prototype);

Player.prototype.save = function(t) {
    this.savedEatPauseFramesLeft[t] = this.eatPauseFramesLeft;
    this.savedNextDirEnum[t] = this.nextDirEnum;
    this.savedStopped[t] = this.stopped;

    Actor.prototype.save.call(this,t);
};

Player.prototype.load = function(t) {
    this.eatPauseFramesLeft = this.savedEatPauseFramesLeft[t];
    this.setNextDir(this.savedNextDirEnum[t]);
    this.stopped = this.savedStopped[t];

    Actor.prototype.load.call(this,t);
};

// reset the state of the player on new level or level restart
Player.prototype.reset = function() {

    this.setNextDir(this.startDirEnum);
    this.stopped = false;
    this.inputDirEnum = undefined;

    this.eatPauseFramesLeft = 0;   // current # of frames left to pause after eating

    // call Actor's reset function to reset to initial position and direction
    Actor.prototype.reset.apply(this);

};

// sets the next direction and updates its dependent variables
Player.prototype.setNextDir = function(nextDirEnum) {
    setDirFromEnum(this.nextDir, nextDirEnum);
    this.nextDirEnum = nextDirEnum;
};

// gets the number of steps to move in this frame
Player.prototype.getNumSteps = function() {
    if (turboMode)
        return 2;

    var pattern = energizer.isActive() ? STEP_PACMAN_FRIGHT : STEP_PACMAN;
    return this.getStepSizeFromTable(level, pattern);
};

Player.prototype.getStepFrame = function(steps) {
    if (steps == undefined) {
        steps = this.steps;
    }
    return Math.floor(steps/2)%4;
};

Player.prototype.getAnimFrame = function(frame) {
    if (frame == undefined) {
        frame = this.getStepFrame();
    }
    if (gameMode == GAME_MSPACMAN || gameMode == GAME_COOKIE) { // ms. pacman starts with mouth open
        frame = (frame+1)%4;
        if (state == deadState)
            frame = 1; // hack to force this frame when dead
    }
    if (gameMode != GAME_OTTO) {
        if (frame == 3) 
            frame = 1;
    }
    return frame;
};

Player.prototype.setInputDir = function(dirEnum) {
    this.inputDirEnum = dirEnum;
};

Player.prototype.clearInputDir = function(dirEnum) {
    if (dirEnum == undefined || this.inputDirEnum == dirEnum) {
        this.inputDirEnum = undefined;
    }
};

// move forward one step
Player.prototype.step = (function(){

    // return sign of a number
    var sign = function(x) {
        if (x<0) return -1;
        if (x>0) return 1;
        return 0;
    };

    return function() {

        // just increment if we're not in a map
        if (!map) {
            this.setPos(this.pixel.x+this.dir.x, this.pixel.y+this.dir.y);
            return 1;
        }

        // identify the axes of motion
        var a = (this.dir.x != 0) ? 'x' : 'y'; // axis of motion
        var b = (this.dir.x != 0) ? 'y' : 'x'; // axis perpendicular to motion

        // Don't proceed past the middle of a tile if facing a wall
        this.stopped = this.stopped || (this.distToMid[a] == 0 && !isNextTileFloor(this.tile, this.dir));
        if (!this.stopped) {
            // Move in the direction of travel.
            this.pixel[a] += this.dir[a];

            // Drift toward the center of the track (a.k.a. cornering)
            this.pixel[b] += sign(this.distToMid[b]);
        }


        this.commitPos();
        return this.stopped ? 0 : 1;
    };
})();

var sortedDistances = [];
var shortestDistance = 500;

var setFleeFromTarget = function() {
    var blinkyDistanceX = pacman.tile.x - blinky.tile.x;
    var blinkyDistanceY = pacman.tile.y - blinky.tile.y;
    var blinkyDistance = blinkyDistanceX * blinkyDistanceX + blinkyDistanceY * blinkyDistanceY;

    var pinkyDistanceX = pacman.tile.x - pinky.tile.x;
    var pinkyDistanceY = pacman.tile.y - pinky.tile.y;
    var pinkyDistance = pinkyDistanceX * pinkyDistanceX + pinkyDistanceY * pinkyDistanceY;

    var inkyDistanceX = pacman.tile.x - inky.tile.x;
    var inkyDistanceY = pacman.tile.y - inky.tile.y;
    var inkyDistance = inkyDistanceX * inkyDistanceX + inkyDistanceY * inkyDistanceY;

    var clydeDistanceX = pacman.tile.x - clyde.tile.x;
    var clydeDistanceY = pacman.tile.y - clyde.tile.y;
    var clydeDistance = clydeDistanceX * clydeDistanceX + clydeDistanceY * clydeDistanceY;

    var arrayDistances = [
        {name: blinky.name, distance: blinkyDistance, actor: blinky, mode: blinky.mode},
        {name: pinky.name, distance: pinkyDistance, actor: pinky, mode: pinky.mode},
        {name: inky.name, distance: inkyDistance, actor: inky, mode: inky.mode},
        {name: clyde.name, distance: clydeDistance, actor: clyde, mode: clyde.mode},
    ];

    sortedDistances = _.sortBy(arrayDistances, 'distance');
    sortedDistances = _.filter(sortedDistances, function(obj) { return obj.mode === GHOST_OUTSIDE || obj.mode === GHOST_LEAVING_HOME});

    if (sortedDistances[0]) {
        pacman.fleeFrom = sortedDistances[0].actor;
        shortestDistance = sortedDistances[0].distance;
    }
    else {
        pacman.fleeFrom = pinky;
        shortestDistance = pinkyDistance;
    }
};

var tileContainsGhost = function(tile) {
    if (blinky.tile.x === tile.x && blinky.tile.y === tile.y) return true;
    if (pinky.tile.x === tile.x && pinky.tile.y === tile.y) return true;
    if (inky.tile.x === tile.x && inky.tile.y === tile.y) return true;
    if (clyde.tile.x === tile.x && clyde.tile.y === tile.y) return true;
};

var pathContainsEnergizer = function(tile, direction) {
    var nextTile1 = { x: tile.x + direction.x, y: tile.y + direction.y};
    var nextTile2 = { x: tile.x + (2*direction.x), y: tile.y + (2*direction.y)};

    if (!map.isFloorTile(nextTile1.x, nextTile1.y || tileContainsGhost(nextTile1)))
        return false;
    if (map.isEnergizerTile(nextTile1.x, nextTile1.y)) {
        return true;
    }
    if (!map.isFloorTile(nextTile2.x, nextTile2.y) || tileContainsGhost(nextTile2))
        return false;
    if (map.isEnergizerTile(nextTile2.x, nextTile2.y)) {
        return true;
    }

    return false;
};

var isThereAnEnergizerAnyDirection = function(tile) {
    for (var dirEnum = 0; dirEnum < 4; dirEnum++) {
        var direction = getDirFromEnum(dirEnum);
        if (pathContainsEnergizer(tile, direction)) {
            return dirEnum;
        }
    }
    return -1;
};

var findNearestDot = function(tile) {
    for (var index = 0; index < mapHeight_Tile; index++)
    {
        // use y for outer loop so we prefer going up since we start at the bottom of the map
        var indexY = tile.y - index; if (indexY < 0) indexY = 0;
        var maxIndexY = tile.y + index; if (maxIndexY > mapHeight_Tile) maxIndexY = mapHeight_Tile;
        for (; indexY < maxIndexY; indexY++)
        {
            // iterate over x from highest to lowest so we prefer to go right
            // because at the beginning of levels ghosts always go left
            var indexX = tile.x + index; if (indexX > mapWidth_Tile) indexX = mapWidth_Tile;
            var minIndexX = tile.x - index; if (minIndexX < 0) minIndexX = 0;
            for (; indexX > minIndexX; indexX--)
            {
                if (map.isDotTile(indexX, indexY)) {
                    return {x: indexX, y: indexY};
                }
            }
        }
    }
    return {x:0,y:0};
};

var targetFruitAppropriately = function() {
    var fruitDistance = Infinity;
    if (fruit.isPresent()) {
        var fruitTileX = Math.floor(fruit.pixel.x / tileSize);
        var fruitTileY = Math.floor(fruit.pixel.y / tileSize);
        var fruitDistanceX = pacman.tile.x - fruitTileX;
        var fruitDistanceY = pacman.tile.y - fruitTileY;
        fruitDistance = fruitDistanceX * fruitDistanceX + fruitDistanceY * fruitDistanceY;
    }
    if (fruitDistance < shortestDistance) {
        this.targetTile = {x:fruitTileX, y: fruitTileY};
        this.targetting = "huntingFruit";
    }
}

// determine direction
Player.prototype.steer = function() {

    // if AI-controlled, only turn at mid-tile
    if (this.ai) {
        if (this.stopped) {
            this.stopped = false;
        }
        
        setFleeFromTarget();

        if (pacman.fleeFrom.scared) {
            this.targetTile.x = pacman.fleeFrom.tile.x;
            this.targetTile.y = pacman.fleeFrom.tile.y;
            if (shortestDistance > 50) {
                this.targetTile.x += (3*pacman.fleeFrom.dir.x);
                this.targetTile.y += (3*pacman.fleeFrom.dir.y);
            }
            this.targetting = pacman.fleeFrom.name;
            targetFruitAppropriately();
        }
        else if (shortestDistance > 50) {
            if (this.targetting != "huntingdots" ||
                (this.targetTile.x === this.tile.x && this.targetTile.y === this.tile.y)) {
                this.targetTile = findNearestDot(this.tile);
                this.targetting = "huntingdots";
            }
            targetFruitAppropriately();
        }
        else {
            this.targetting = false;

            if (this.distToMid.x === 0 || this.distToMid.y === 0) {

                this.numGhostsWithin30 = _.filter(sortedDistances,  function(ghost){ return ghost.distance < 30; }).length;
                this.numGhostsWithin40 = _.filter(sortedDistances,  function(ghost){ return ghost.distance < 40; }).length;

                getAllGhostFutureTiles(AIDepth);
                var potentialRoutes = [];
                var openDirEnums = getOpenDirEnums(this.tile, this.dirEnum);
                for (var index = 0; index < openDirEnums.length; index++) {
                    var potentialDirEnum = openDirEnums[index];
                    var potentialDirection = getDirFromEnum(potentialDirEnum);
                    var nextTile = {x: this.tile.x + potentialDirection.x, y: this.tile.y + potentialDirection.y};

                    var potentialRoute = _.extend(getOpenPathDistance(nextTile, potentialDirEnum, 1), {dirEnum: potentialDirEnum});
                    calculateValue(potentialRoute);

                    if (potentialDirEnum === this.prevBestRoute.dirEnum) {
                        this.prevBestRoute.value = potentialRoute.value;
                    }

                    potentialRoutes.push(potentialRoute);
                }

                var bestRoute = _.max(potentialRoutes, function (route) { return route.value; });

                if (bestRoute.value > this.prevBestRoute.value || !_.contains(openDirEnums, this.prevBestRoute.dirEnum)) {
                    this.prevBestRoute = bestRoute;
                    this.setNextDir(bestRoute.dirEnum);
                }
                else {
                    this.setNextDir(this.prevBestRoute.dirEnum);
                }
            }
        }

        if (this.targetting) {
            this.setNextDir(myGetTurnClosestToTarget(this.tile, this.targetTile));
        }

        if (pathContainsEnergizer(this.tile, this.nextDir) || this.IamDancing) {
            if (shortestDistance > 10 || this.IamDancing) {
                var oppDirEnum = rotateAboutFace(this.dirEnum);
                this.setNextDir(oppDirEnum);
                this.IamDancing = !this.IamDancing;
            }
        }

        var nextDirOpen = isNextTileFloor(this.tile, this.nextDir);
        if (nextDirOpen) {
            this.setDir(this.nextDirEnum);
        }
    }
    else {
        this.targetting = undefined;
    }

    // manual input
    if (this.inputDirEnum == undefined) {
        if (this.stopped) {
            this.setDir(this.nextDirEnum);
        }
    }
    else {
        // Determine if input direction is open.
        var inputDir = getDirFromEnum(this.inputDirEnum);
        var inputDirOpen = isNextTileFloor(this.tile, inputDir);

        if (inputDirOpen) {
            this.setDir(this.inputDirEnum);
            this.setNextDir(this.inputDirEnum);
            this.stopped = false;
        }
        else {
            if (!this.stopped) {
                this.setNextDir(this.inputDirEnum);
            }
        }
    }
};

var AIDepth = 15;
var calculateValue = function(potentialRoute) {
    potentialRoute.value = potentialRoute.distance + potentialRoute.dots / 2;

    if (potentialRoute.energizer && (shortestDistance < 10 || this.numGhostsWithin30 >= 2 || this.numGhostsWithin40 >= 3)) {
        potentialRoute.value += AIDepth;
    }
};
var getOpenPathDistance = function(tile, dirEnum, numSteps) {
    if (numSteps > AIDepth || tileIntersectsGhostPaths(tile, numSteps)) {
        return {distance: 0, dots: 0, energizer: 0};
    }

    var openDirEnums = getOpenDirEnums(tile, dirEnum, true);
    var potentialRoutes = [];

    for (var index = 0; index < openDirEnums.length; index++) {
        var potentialDirEnum = openDirEnums[index];
        var potentialDirection = getDirFromEnum(potentialDirEnum);
        var nextTile = {x: tile.x + potentialDirection.x, y: tile.y + potentialDirection.y};

        var potentialRoute = getOpenPathDistance(nextTile, potentialDirEnum, numSteps + 1);
        calculateValue(potentialRoute);
        potentialRoutes.push(potentialRoute);
    }

    var bestRoute = _.max(potentialRoutes, function (route) { return route.value; });
    return {
        distance: 1 + bestRoute.distance,
        dots: (map.isDotTile(tile.x, tile.y) ? 1 : 0) + bestRoute.dots,
        energizer: map.isEnergizerTile(tile.x, tile.y) || bestRoute.energizer,
    };
};

var tileIntersectsGhostPaths = function(tile, numSteps) {
    if (_.findWhere(blinky.futureTiles.slice(0, numSteps+1), {x: tile.x, y: tile.y})) { return true; }

    if (_.findWhere(pinky.futureTiles.slice(0, numSteps+1), {x: tile.x, y: tile.y})) { return true; }

    if (_.findWhere(inky.futureTiles.slice(0, numSteps+1), {x: tile.x, y: tile.y})) { return true; }

    if (_.findWhere(clyde.futureTiles.slice(0, numSteps+1), {x: tile.x, y: tile.y})) { return true; }

    return false;
};

var getAllGhostFutureTiles = function(numSteps) {
    blinky.futureTiles = getGhostFutureTiles(blinky, numSteps);
    pinky.futureTiles = getGhostFutureTiles(pinky, numSteps);
    inky.futureTiles = getGhostFutureTiles(inky, numSteps);
    clyde.futureTiles = getGhostFutureTiles(clyde, numSteps);
};

var getGhostFutureTiles = function(actor, numSteps) {
    if (!actor.targetting) return [];

    // current state of the predicted path
    var tile = { x: actor.tile.x, y: actor.tile.y};
    var target = actor.targetTile;
    var dir = { x: actor.dir.x, y: actor.dir.y };
    var dirEnum = actor.dirEnum;
    var openTiles;

    var futureTiles = [_.clone(tile)];

    for (var index = 0; index < numSteps; index++) {
        // predict next turn from current tile
        openTiles = getOpenTiles(tile, dirEnum);
        if (actor != pacman && map.constrainGhostTurns)
            map.constrainGhostTurns(tile, openTiles, dirEnum);
        dirEnum = getTurnClosestToTarget(tile, target, openTiles);
        setDirFromEnum(dir,dirEnum);

        // move to next tile
        tile.x += dir.x;
        tile.y += dir.y;

        futureTiles.push(_.clone(tile));

        // exit if we're already on the target
        if (tile.x == target.x && tile.y == target.y) {
            break;
        }
    }

    return futureTiles;
};

// update this frame
Player.prototype.update = function(j) {

    var numSteps = this.getNumSteps();
    if (j >= numSteps)
        return;

    // skip frames
    if (this.eatPauseFramesLeft > 0) {
        if (j == numSteps-1)
            this.eatPauseFramesLeft--;
        return;
    }

    // call super function to update position and direction
    Actor.prototype.update.call(this,j);

    // eat something
    if (map) {
        var t = map.getTile(this.tile.x, this.tile.y);
        if (t == '.' || t == 'o') {

            // apply eating drag (unless in turbo mode)
            if (!turboMode) {
                this.eatPauseFramesLeft = (t=='.') ? 1 : 3;
            }

            map.onDotEat(this.tile.x, this.tile.y);
            ghostReleaser.onDotEat();
            fruit.onDotEat();
            addScore((t=='.') ? 10 : 50);

            if (t=='o')
                energizer.activate();
        }
    }
};
