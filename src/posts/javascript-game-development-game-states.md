---
title: 'JavaScript Game Development Managing Game States'
date: 2014-03-02
template: 'post.html'
---

Unlike an application, which typically only has one state of execution where
you have your data and manipulate it with various tools and operations, games, even
a simplistic one, often has several distinct states of execution. If we use the
classic [pong](http://www.atari.com/arcade#!/arcade/pong/play) as an example we
can identify five unique states of execution the game goes through, the loading
state, a title state, a playing state, a pause state and a game over state.

We could handle this using conditions to control the execution flow.  However
such an approach quickly becomes tedious and difficult to maintain, even for a
simple game.

## What Is a Game State?
Lets take a step back and actually define what a game state is, a game
state is a separate state of execution within the game, that in most
cases has its own unique event handling, logic and drawing mechanisms.

Additionally, a game state will also need to be able to execute code when it's activated and deactivated.

```javascript
class GameState {
   constructor() {
      this.parent = null;
   }

   activate() {
   }

   deactivate() {
   }

   handleEvent(event) {
   }

   draw(deltaTime) {
   }

   step(deltaTime) {
   }
}
```

## Managing Game States
So we've defined our states to have initialize, pause, resume and dispose
methods, the rationale behind that is we are going to keep our game states in a
stack, where the top state is considered the current state, drawing, stepping
and event handling will be delegated to this state.

When pushing a state, the previous state will be paused and the new state will
be initialized, when popping a state the state is disposed and the previous
state is resumed.

This will allow us to temporarily push new states on top on top of the stack,
without destroying any of the data or expectations of the previous states.

For example, the player is in a play state and presses the `escape` key, you
want to present them with a menu screen, you do this by pushing a new menu
state and popping the state again when the player presses `escape` in the menu
state.

```javascript
class Game {
   constructor() {
      this.states = [];

      var events = ['keydown', 'keyup'];
      for (var event of events) {
         window.addEventListener(event, this.handleEvent.bind(this));
      }

      this.time = 0;

      window.requestAnimationFrame(this.tick.bind(this));
   }

   pushState(state) {
      var states = this.states;

      // If there is a state at the top of the stack, deactivate it.
      if (states.length > 0) {
         states[states.length - 1].deactivate();
      }

      // Push the new state and activate it.
      states.push(state);
      states[states.length - 1].parent = this;
      states[states.length - 1].activate();
   }

   popState() {
      var states = this.states;

      if (states.length > 0) {
         // Deactivate the top state and remove it.
         this.states[this.states.length - 1].deactivate();
         this.states[this.states.length - 1].parent = null;
         this.states.pop();

         // Activate the previous state.
         if (states.length > 0) {
            states[states.length - 1].activate();
         }
      }
   }

   changeState(state) {
      var states = this.states;

      // Deactivate and remove all states in the stack.
      while(states.length > 0) {
         states[states.length - 1].deactivate();
         states[states.length - 1].parent = null;
         states.pop();
      }

      // Push the state onto the stack.
      pushState(state);
   }

   get currentState() {
      var states = this.states;

      if (states.length > 0) {
         return states[states.length - 1];
      }

      return null;
   }

   handleEvent(event) {
      if (this.currentState) {
         this.currentState.handleEvent(event);
      }
   }

   tick(time) {
      var deltaTime = time - (this.time || time);
      this.time = time;

      if (this.currentState) {
         this.currentState.step(deltaTime);
         this.currentState.draw(deltaTime);
      }

      window.requestAnimationFrame(this.tick.bind(this));
   }

   // ...
}
```

## Composing Game States
So far, we have defined what a game state is and simple mechanics for
managing the state stack. So how would it actually work in practice? Lets
explore a simple example, with simulation and presentation code omitted for clarity.

Starting with our game's title state, this will be a simple state in which the player
can press the spacebar to start playing our game.

```javascript
class GameTitleState extends GameState {
   constructor() {
      super();

      this.input = {
         start: false,
      };
   }

   handleEvent(event) {
      if (event.type == 'keydown') {
         if (event.keyCode == 32) {
            this.input.start = true;
         }
      }
   }

   step(deltaTime) {
      if (this.input.start) {
         var playState = new GamePlayState();
         this.parent.changeState(playState);
      }
   }

   draw(deltaTime) {
      // ...
   }
}
```
---
Next is our play state, which would handle the actual game physics and drawing,
the player should also be able to pause the game when pressing the escape key,
which we will handle by pushing pause state on top of stack.

```javascript
//
//
class GamePlayState extends GameState {
   constructor() {
      super();

      this.input = {
         pause: false,
         // ...
      };

      // ...
   }

   handleEvent(event) {
      // ...

      if (event.type == 'keydown') {
         if (event.keyCode == 27) {
            this.input.pause = true;
         }
      }
   }

   step(deltaTime) {
      if (this.input.pause) {
         this.input.pause = false;

         var pauseState = new GamePauseState(this);
         this.parent.pushState(pauseState);
      }

      this.board.step(deltaTime);

      if (this.board.gameOver) {
         var overState = new GameOverState(this);
         this.pushState(overState);
      }
   }

   draw(deltaTime) {
      this.board.draw(deltaTime);
   }
}
```
---

Now, for our pause state we want to overlay it on the play state itself, so
we'll need to create a composite state, in which the draw method of the play
state still gets called.

```javascript
class GamePauseState extends GameState {
   constructor(playState) {
      super();

      this.input = {
         resume: false,
         // ...
      };

      this.playState = playState;
   }

   handleEvent(event) {
      // ...

      if (event.type == 'keydown') {
         if (event.keyCode == 27) {
            this.input.resume = true;
         }
      }
   }

   step(deltaTime) {
      if (this.input.resume) {
         this.parent.popState();
      }
   }

   draw(deltaTime) {
      this.playState.draw(0);

      // ...
   }
}
```
---

Finally, we have our game over state, which be a composite state as-well and when the
player presses the spacebar we come full circle and change to a new title
state.

```javascript
class GameOverState extends GameState {
   constructor(playState) {
      super();

      this.input = {
         start: false,
         // ...
      };

      this.playState = playState;
   }

   handleEvent(event) {
      // ...

      if (event.type == 'keydown') {
         if (event.keyCode == 32) {
            this.input.start = true;
         }
      }
   }

   step(deltaTime) {
      if (this.input.start) {
         var titleState = new GameTitleState();
         this.parent.changeState(titleState);
      }
   }

   draw(deltaTime) {
      this.playState.draw(deltaTime);

      // ...
   }
}
```
