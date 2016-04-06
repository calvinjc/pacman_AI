# Pacman AI

I want to see if I can create an automated pacman player that can play the game intelligently on it's own.


#### NOTE: I did not create this game!
Major props to ShaunW for recreating the entire suite of pacman games as well as great practice tools.  Thank you for publishing your source code!  I highly recommend everyone check out his page and play the game for yourself at http://pacman.shaunew.com/.  

I have merely added on to the exiting game and AI framework.


#### Version 1.0
The AI in the original code consisted of "Run from Pinky unless he's scared then chase him".  The first thing I did was calculate which ghost was the closest and run from them.  Similarly after eating an energizer pacman will now chase the closest ghost.  This doesn't work very well because pacman gets stuck at the bottom and is only running away and doesn't eat many dots.  As a quick addition I made pacman turn in random directions when the ghosts were a certain distance away (I call this v0.5 to show how primitive things started out).  In version 1.0 I find and track the nearest dot when the ghosts are a certain distance away and implement some basic evasion.  Pacman now completes levels in a reasonable time frame (given enough lives).... success!

#### Version 2.0
Try to avoid getting trapped in corners by looking for the longest open direction.  Target fruit when it is closer than the nearest ghost.  Finally stop wasting energizers by dancing around until a ghost is near.  It still wastes a lot of time that could be spent eating other dots, but at least we aren't eating an energizer when no one is around.  Improve hunting scared ghosts by targeting a point in front of them instead of always chasing them from behind (this is same way pinky targets pacman) but only when they are a certain distance away.  I realized that the piece I added to avoid getting trapped in corners has side effects that leads to lots of other mistakes making that part a wash or possibly even worse.... I'm still just getting started, so far I've only been doing very simple general assessments and decision making.
