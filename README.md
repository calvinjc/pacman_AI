# Pacman AI

I wanted to see if I could create an automated Pacman player that can play the game intelligently on it's own.

Check it out at: http://pacman.calvinjc.com

#### NOTE: I did not create this game!
Major props to Shaun Williams for recreating the entire suite of Pacman games as well as great practice tools.  Thank you for publishing your source code!  I highly recommend everyone check out his page and play the game for yourself at http://pacman.shaunew.com/.  

I have merely added on to the existing game and AI framework.


#### Version 1.0
The AI in the original code consisted of "Run from Pinky unless he's scared then chase him".  The first thing I did was calculate which ghost was the closest and run from them.  Similarly after eating an energizer Pacman will now chase the closest ghost.  This doesn't work very well because Pacman gets stuck at the bottom and is only running away and doesn't eat many dots.  As a quick addition I made Pacman turn in random directions when the ghosts were a certain distance away (I call this v0.5 to show how primitive things started out).  In version 1.0 I find and track the nearest dot when the ghosts are a certain distance away and implement some basic evasion.  Pacman now completes levels in a reasonable time frame (given enough lives)..... success!

#### Version 2.0
Try to avoid getting trapped in corners by looking for the longest open direction.  Target fruit when it is closer than the nearest ghost.  Finally stop wasting energizers by dancing around until a ghost is near.  It still wastes a lot of time that could be spent eating other dots, but at least we aren't eating an energizer when no one is around.  Improve hunting scared ghosts by targeting a point in front of them instead of always chasing them from behind (this is same way pinky targets Pacman) but only when they are a certain distance away.  I realized that the piece I added to avoid getting trapped in corners has side effects that leads to lots of other mistakes making that part a wash or possibly even worse..... I'm still just getting started, so far I've only been doing very simple general assessments and decision making.

#### Version 3.0
Recursion!! It now calculates the ghosts future positions and recursively searches all open paths to determine the longest path that doesn't encounter a ghost or the future position of a ghost.  Because of the computationally intensive nature of recursion we must start to care about performance.  I've determined that I can only search to a depth of about 10 tiles without noticing any framerate issues.  Searching to a depth of 15 tiles becomes choppy pretty frequently, but 12 or 13 is generally ok in most cases..... Dang Pacman is getting good!

#### Version 4.0
Determine a value for each potential route that incorporates the number of dots/fruit/energizers etc. instead of just distance.  So now we can eat dots while running away from ghosts.  I'm also calculating the position of the ghosts once instead of each time we need to check for collisions to improve performance. Pacman is getting so good that I wanted to start gathering some data.  So I removed the training wheels and it now plays the real game! No more practice mode with infinite lives.  I also made it write out the results to the console and automatically start a new game.  So now you can let it run for a long period of time and view the results.  I chose to set the number of lives to 2 with an extra life at 20000 pts.  I know this isn't standard but these are the settings at which I have the most human data to compare to.  I left a couple instances running over night and AI Pacman beat my personal best multiple times.  Of course for every really good run there were lots of bad ones, but hey that's what happens when I play too..... I made an AI that's better than me: WIN!

#### Version 4.5
Render a visualization of the route that Pacman has selected.  This allows you to see in real time what Pacman is thinking.  This looks pretty cool and is also useful while debugging.  I had more planned but I wanted to get this out quicker. I called it a .5 version because the gameplay hasn't changed significantly.  I also changed the number of starting lives back to 3 with the extra life at 10000 pts because these are the game defaults and it demos better.

#### Version 5.0
Improve recursive searching by calculating future ghost positions based on the hypothetical Pacman future position, and various other value adjustment changes.  Make hunting dots more efficient and don't waste time twitching near an energizer when no ghosts are around.  Start making better use of the tunnels!  Target scared ghosts while running away from live ghosts.  Allow user to choose their own settings instead of having them hard coded!  Create a new mode where users can play the game themselves while still seeing the AI's recommended route!! This mode can be selected in the settings or can be toggled mid-game by pressing the Spacebar key.  This mode is only compatible/enabled on desktop browsers due to conflicts with swipe actions on mobile.
