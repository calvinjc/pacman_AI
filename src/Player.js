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

    this.huntDotsThreshold = HuntDotsDistanceThreshold;

    this.prevBestRoute = { dirEnum: 0, distance: 0, dots: 0, energizer: 0, value: 0, fruit: 0, targetTiles: []};
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
        return _.clone(nextTile1);
    }
    if (!map.isFloorTile(nextTile2.x, nextTile2.y) || tileContainsGhost(nextTile2))
        return false;
    if (map.isEnergizerTile(nextTile2.x, nextTile2.y)) {
        return _.clone(nextTile2);
    }

    return false;
};

var isThereAnEnergizerAnyDirection = function(tile) {
    for (var dirEnum = 0; dirEnum < 4; dirEnum++) {
        var direction = getDirFromEnum(dirEnum);
        var energizer = pathContainsEnergizer(tile, direction);
        if (energizer) {
            return {dirEnum: dirEnum, energizerTile: energizer};
        }
    }
    return {dirEnum: -1};
};

var findNearestDot = function(tile, player, options, recursive) {
    var dotTile = {x:-1, y:-1};
    if (!options) {
        options = {minX: 0, maxX: mapWidth_Tile, minY: 0, maxY: mapHeight_Tile};
    }
    else {
        if (!options.minX) options.minX = 0;
        if (!options.maxX) options.maxX = mapWidth_Tile;
        if (!options.minY) options.minY = 0;
        if (!options.maxY) options.maxY = mapHeight_Tile;
    }

    for (var radius = 1; radius < mapHeight_Tile; radius++)
    {
        var upY = tile.y - radius;
        var downY = tile.y + radius;
        var leftX = tile.x - radius;
        var rightX = tile.x + radius;

        for (var index = 0; index <= radius; index++) {
            //up
            if (upY >= options.minY && upY <= options.maxY) {
                if ((map.isDotTile(tile.x + index, upY) || map.isEnergizerTile(tile.x + index, upY))
                    && (tile.x + index) >= options.minX && (tile.x + index) <= options.maxX) {
                    dotTile =  {x: tile.x + index, y: upY};
                    break;
                }
                if ((map.isDotTile(tile.x - index, upY) || map.isEnergizerTile(tile.x - index, upY))
                    && (tile.x - index) >= options.minX && (tile.x - index) <= options.maxX) {
                    dotTile = {x: tile.x - index, y: upY};
                    break;
                }
            }
            //right
            if (rightX >= options.minX && rightX <= options.maxX) {
                if ((map.isDotTile(rightX, tile.y - index) || map.isEnergizerTile(rightX, tile.y - index))
                    && (tile.y - index) >= options.minY && (tile.y - index) <= options.maxY) {
                    dotTile = {x: rightX, y: tile.y - index};
                    break;
                }
                if ((map.isDotTile(rightX, tile.y + index) || map.isEnergizerTile(rightX, tile.y + index))
                    && (tile.y + index) >= options.minY && (tile.y + index) <= options.maxY) {
                    dotTile = {x: rightX, y: tile.y + index};
                    break;
                }
            }
            //left
            if (leftX >= options.minX && leftX <= options.maxX) {
                if ((map.isDotTile(leftX, tile.y - index) || map.isEnergizerTile(rightX, tile.y - index))
                    && (tile.y - index) >= options.minY && (tile.y - index) <= options.maxY) {
                    dotTile = {x: leftX, y: tile.y - index};
                    break;
                }
                if ((map.isDotTile(leftX, tile.y + index) || map.isEnergizerTile(rightX, tile.y + index))
                    && (tile.y + index) >= options.minY && (tile.y + index) <= options.maxY) {
                    dotTile = {x: leftX, y: tile.y + index};
                    break;
                }
            }
            //down
            if (downY >= options.minY && downY <= options.maxY) {
                if ((map.isDotTile(tile.x + index, downY) || map.isEnergizerTile(tile.x + index, downY))
                    && (tile.x + index) >= options.minX && (tile.x + index) <= options.maxX) {
                    dotTile = {x: tile.x + index, y: downY};
                    break;
                }
                if ((map.isDotTile(tile.x - index, downY) || map.isEnergizerTile(tile.x - index, downY))
                    && (tile.x - index) >= options.minX && (tile.x - index) <= options.maxX) {
                    dotTile = {x: tile.x - index, y: downY};
                    break;
                }
            }
        }

        if (dotTile.x >= 0 && dotTile.y >= 0) break;
    }

    // find a different Target
    var energizer = isThereAnEnergizerAnyDirection(dotTile);
    if (energizer.dirEnum > -1 && map.dotsLeft() > 10 && !recursive) {
        player.avoidThisTileWhileFindingBestRoute = _.clone(energizer.energizerTile);
        options = {};
        //left half
        if (energizer.energizerTile.x < (mapWidth_Tile/2)) {
            options.minX = energizer.energizerTile.x +3;
        }
        else { //right half
            options.maxX = energizer.energizerTile.x -3;
        }

        //top half
        if (energizer.energizerTile.y < (mapHeight_Tile/2)) {
            options.minY = energizer.energizerTile.y +3;
        }
        else { //bottom half
            options.maxY = energizer.energizerTile.y -3;
        }

        return findNearestDot(tile, player, options, true);
    }
    return dotTile;
};

var targetFruitAppropriately = function(player) {
    var fruitDistance = Infinity;
    if (fruit.isPresent()) {
        var fruitTileX = Math.floor(fruit.pixel.x / tileSize);
        var fruitTileY = Math.floor(fruit.pixel.y / tileSize);
        var fruitDistanceX = pacman.tile.x - fruitTileX;
        var fruitDistanceY = pacman.tile.y - fruitTileY;
        fruitDistance = fruitDistanceX * fruitDistanceX + fruitDistanceY * fruitDistanceY;
    }
    if (fruitDistance < shortestDistance) {
        player.targetTile = {x:fruitTileX, y: fruitTileY};
        player.targetting = "huntingFruit";
    }
};

// determine direction
Player.prototype.steer = function() {

    if (this.ai) {
        if (this.stopped) {
            this.stopped = false;
        }
        
        setFleeFromTarget();

        if (pacman.fleeFrom.scared) {
            this.huntDotsThreshold = HuntDotsDistanceThreshold;
            this.targetTile.x = pacman.fleeFrom.tile.x;
            this.targetTile.y = pacman.fleeFrom.tile.y;
            if (shortestDistance > 50) {
                this.targetTile.x += (3*pacman.fleeFrom.dir.x);
                this.targetTile.y += (3*pacman.fleeFrom.dir.y);
            }
            if (this.targetting !== pacman.fleeFrom.name) {
                this.targetting = pacman.fleeFrom.name;
                this.avoidThisTileWhileFindingBestRoute = undefined;
            }
            targetFruitAppropriately(this);

            this.setNextDir(myGetTurnClosestToTarget(this));
        }
        else if (shortestDistance > this.huntDotsThreshold) {
            if (!AutoPilot || this.targetting != "huntingdots" ||
                (this.targetTile.x === this.tile.x && this.targetTile.y === this.tile.y)) {
                this.avoidThisTileWhileFindingBestRoute = undefined;
                this.huntDotsThreshold = HuntDotsDistanceThreshold - 5;

                this.targetTile = findNearestDot(this.tile, this);
                this.targetting = "huntingdots";
            }
            targetFruitAppropriately(this);

            this.setNextDir(myGetTurnClosestToTarget(this));
        }
        else {
            this.huntDotsThreshold = HuntDotsDistanceThreshold;
            this.targetting = false;

            this.numGhostsWithinA = _.filter(sortedDistances,  function(ghost){ return ghost.distance < 30; }).length;
            this.numGhostsWithinB = _.filter(sortedDistances,  function(ghost){ return ghost.distance < 40; }).length;
            this.numGhostsWithinC = _.filter(sortedDistances,  function(ghost){ return ghost.distance < 50; }).length;

            calcAllGhostFutureTiles(0, 1, this.tile, getDirFromEnum(this.dirEnum));
            var potentialRoutes = [];
            var openDirEnums = getOpenDirEnums(this.tile, this.dirEnum);
            for (var index = 0; index < openDirEnums.length; index++) {
                var potentialDirEnum = openDirEnums[index];
                var potentialDirection = getDirFromEnum(potentialDirEnum);
                var nextTile = {x: this.tile.x + potentialDirection.x, y: this.tile.y + potentialDirection.y};
                var oppositeTunnelTile = map.getOppositeTunnelTile(nextTile);
                if (oppositeTunnelTile) nextTile = oppositeTunnelTile;

                var potentialRoute = _.extend(getOpenPathDistance(nextTile, potentialDirEnum, 1), {dirEnum: potentialDirEnum});
                if (oppositeTunnelTile) potentialRoute.containsTunnel = true;
                calculateValue(potentialRoute, oppositeTunnelTile);

                if (potentialDirEnum === this.prevBestRoute.dirEnum) {
                    this.prevBestRoute.value = potentialRoute.value;
                    this.prevBestRoute.targetTiles = potentialRoute.targetTiles;
                }

                potentialRoutes.push(potentialRoute);
            }

            var bestRoute = _.max(potentialRoutes, function (route) { return route.value; });

            if (bestRoute.value > this.prevBestRoute.value || !_.contains(openDirEnums, this.prevBestRoute.dirEnum)) {
                this.prevBestRoute = bestRoute;
                this.setNextDir(bestRoute.dirEnum);
                pacman.targetTiles = bestRoute.targetTiles;
            }
            else {
                this.setNextDir(this.prevBestRoute.dirEnum);
                pacman.targetTiles = this.prevBestRoute.targetTiles;
            }
            pacman.targetTile = {};
        }

        if (pathContainsEnergizer(this.tile, this.nextDir) && shortestDistance > 15 && map.dotsLeft() > 3) {
            var oppDirEnum = rotateAboutFace(this.dirEnum);
            this.setNextDir(oppDirEnum);
        }

        var nextDirOpen = isNextTileFloor(this.tile, this.nextDir);
        if (AutoPilot && nextDirOpen) {
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

var calculateValue = function(potentialRoute, oppositeTunnel) {
    potentialRoute.value = potentialRoute.distance + potentialRoute.dots / 2;
    // use energizers when ghosts are close
    if (potentialRoute.energizer && (shortestDistance < 15 || this.numGhostsWithinA >= 2
        || this.numGhostsWithinB >= 3 || this.numGhostsWithinC === 4))
    {
        potentialRoute.value = AIDepth + (AIDepth / 2);
    }
    //else if (potentialRoute.distance === AIDepth) {
    //    potentialRoute.value -= 3;
    //}

    // target scared ghosts
    if (potentialRoute.scaredGhostDistance) {
        potentialRoute.value = (80 + (AIDepth - potentialRoute.scaredGhostDistance));
    }

    // get fruit while running away
    if (potentialRoute.fruit) {
        potentialRoute.value = (100 + (AIDepth - potentialRoute.fruit));
    }

    // if you can finish the map you don't have to escape the ghosts
    if (potentialRoute.dots === map.dotsLeft()) {
        potentialRoute.value = 500;
    }

    if (potentialRoute.containsTunnel) {
        potentialRoute.value += 2;
    }
};
var getOpenPathDistance = function(tile, dirEnum, numSteps) {
    calcAllGhostFutureTiles(numSteps, 1, tile, getDirFromEnum(dirEnum));
    var intersectGhost = tileIntersectsGhostPaths(tile, numSteps);
    if (numSteps > AIDepth || intersectGhost) {
        var scaredGhostDistance = intersectGhost.isScared ? intersectGhost.distance : 0;

        return {distance: 0, dots: 0, energizer: 0, scaredGhostDistance: scaredGhostDistance, targetTiles: [tile]};
    }

    var openDirEnums = getOpenDirEnums(tile, dirEnum, true);
    var potentialRoutes = [];

    for (var index = 0; index < openDirEnums.length; index++) {
        var potentialDirEnum = openDirEnums[index];
        var potentialDirection = getDirFromEnum(potentialDirEnum);
        var nextTile = {x: tile.x + potentialDirection.x, y: tile.y + potentialDirection.y};
        var oppositeTunnelTile = map.getOppositeTunnelTile(nextTile);
        if (oppositeTunnelTile) nextTile = oppositeTunnelTile;

        var potentialRoute = getOpenPathDistance(nextTile, potentialDirEnum, numSteps + 1);
        if (oppositeTunnelTile) potentialRoute.containsTunnel = true;
        calculateValue(potentialRoute);
        potentialRoutes.push(potentialRoute);
    }

    var bestRoute = _.max(potentialRoutes, function (route) { return route.value; });
    var fruitDistance = 0;
    if (map.tileContainsFruit(tile.x, tile.y)) {
        fruitDistance = numSteps;
    }
    return {
        distance: 1 + bestRoute.distance,
        dots: (map.isDotTile(tile.x, tile.y) ? 1 : 0) + bestRoute.dots,
        energizer: map.isEnergizerTile(tile.x, tile.y) || bestRoute.energizer,
        fruit: fruitDistance || bestRoute.fruit,
        scaredGhostDistance: bestRoute.scaredGhostDistance,
        containsTunnel : bestRoute.containsTunnel,
        targetTiles: [tile].concat(bestRoute.targetTiles)
    };
};

var tileIntersectsGhostPaths = function(tile, numSteps) {
    if (_.findWhere(blinky.futureTiles.slice(0, numSteps+1), {x: tile.x, y: tile.y})) {
        return {isScared: blinky.scared, distance: numSteps};
    }

    if (_.findWhere(pinky.futureTiles.slice(0, numSteps+1), {x: tile.x, y: tile.y})) {
        return {isScared: pinky.scared, distance: numSteps};
    }

    if (_.findWhere(inky.futureTiles.slice(0, numSteps+1), {x: tile.x, y: tile.y})) {
        return {isScared: inky.scared, distance: numSteps};
    }

    if (_.findWhere(clyde.futureTiles.slice(0, numSteps+1), {x: tile.x, y: tile.y})) {
        return {isScared: clyde.scared, distance: numSteps};
    }

    return false;
};

var calcAllGhostFutureTiles = function(start, numSteps, pacmanTile, pacmanDir) {
    calcGhostFutureTiles(blinky, start, numSteps, pacmanTile, pacmanDir);
    calcGhostFutureTiles(pinky, start, numSteps, pacmanTile, pacmanDir);
    calcGhostFutureTiles(inky, start, numSteps, pacmanTile, pacmanDir);
    calcGhostFutureTiles(clyde, start, numSteps, pacmanTile, pacmanDir);
};

var calcGhostFutureTiles = function(actor, start, numSteps, pacmanTile, pacmanDir) {
    if (start > 1 && actor.futureTiles.length !== start) {
        actor.futureTiles = actor.futureTiles.slice(0, start);
        actor.futureStates = actor.futureStates.slice(0, start);
    }
    
    if (!(actor.mode === GHOST_OUTSIDE || actor.mode === GHOST_LEAVING_HOME)) {
        actor.futureTiles = [];
        actor.futureStates = [];
        return;
    }

    if (start === 0) {
        actor.futureTiles = [{x: actor.tile.x, y: actor.tile.y}];
        actor.futureStates = [{
            tile: {x: actor.tile.x, y: actor.tile.y},
            dir: { x: actor.dir.x, y: actor.dir.y },
            dirEnum: actor.dirEnum
        }];
    }

    // current state of the predicted path
    var currentState = actor.futureStates[actor.futureStates.length-1];
    var tile = _.clone(currentState.tile);
    var dir = _.clone(currentState.dir);
    var dirEnum = currentState.dirEnum;


    var target = actor.getHypotheticalTargetTile(pacmanTile, pacmanDir);

    for (var index = 0; index < numSteps; index++) {
        // predict next turn from current tile
        var openTiles = getOpenTiles(tile, dirEnum);
        if (actor != pacman && map.constrainGhostTurns)
            map.constrainGhostTurns(tile, openTiles, dirEnum);
        dirEnum = getTurnClosestToTarget(tile, target, openTiles);
        setDirFromEnum(dir,dirEnum);

        // move to next tile
        tile.x += dir.x;
        tile.y += dir.y;

        actor.futureTiles.push(_.clone(tile));
        actor.futureStates.push({
            tile: _.clone(tile),
            dir: _.clone(dir),
            dirEnum: _.clone(dirEnum)
        });
        // exit if we're already on the target
        if (tile.x == target.x && tile.y == target.y) {
            break;
        }
    }
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
