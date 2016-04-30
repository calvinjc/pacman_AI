//////////////////////////////////////////////////////////////////////////////////////
// Entry Point

window.addEventListener("load", function() {
    loadHighScores();
	loadAISettings();
    initRenderer();
    atlas.create();
    //initSwipe();
	var anchor = window.location.hash.substring(1);
	if (anchor == "learn") {
		switchState(learnState);
	}
	else if (anchor == "cheat_pac" || anchor == "cheat_mspac") {
		gameMode = (anchor == "cheat_pac") ? GAME_PACMAN : GAME_MSPACMAN;
		practiceMode = true;
        switchState(newGameState);
		for (var i=0; i<4; i++) {
			ghosts[i].isDrawTarget = true;
			ghosts[i].isDrawPath = true;
		}
	}
	else {
		gameMode = GAME_MSPACMAN;
		switchState(newGameState);
	}
    executive.init();

	$("#startingLives").val(NumStartingLives);
	$("#extraLifeScore").val(ExtraLifeScore);

	$("#aiDepth").val(AIDepth);
	$("#showPacmanPath").prop('checked', ShowPacmanPath);
	$("#showGhostPaths").prop('checked', ShowGhostPaths);
    $("#playManually").prop('checked', !AutoPilot);
	if (/Mobi/.test(navigator.userAgent)) {
		$("#play-manually-group").hide();
	}

	$("#aiDepth").change(function() {
		AIDepth = parseInt($("#aiDepth").val());
		saveAISettings();
	});

	$("#showPacmanPath").click(function() {
		ShowPacmanPath = $("#showPacmanPath").is(':checked');
		saveAISettings();
	});

	$("#showGhostPaths").click(function() {
		ShowGhostPaths = $("#showGhostPaths").is(':checked');
		saveAISettings();

		blinky.isDrawPath = ShowGhostPaths;
		pinky.isDrawPath = ShowGhostPaths;
		inky.isDrawPath = ShowGhostPaths;
		clyde.isDrawPath = ShowGhostPaths;
	});

	$("#playManually").click(function() {
		AutoPilot = !$("#playManually").is(':checked');
		saveAISettings();
	});

	$("#restartBtn").click(function() {
		saveAISettings();
		switchState(newGameState);
	});
});
