# AI-FPS - Simple First Person Shooter Game

A simple browser-based FPS game built with Three.js.

## Features

- First-person perspective with mouse look controls
- WASD movement
- Shooting mechanics with ammo system
- Enemy AI that tracks and approaches the player
- Health system
- Score tracking
- Win/lose conditions

## How to Play

1. Open `index.html` in a web browser
2. Click "Start Game"
3. Use the following controls:
   - **WASD** - Move around
   - **Mouse** - Look around (click to enable pointer lock)
   - **Left Click** - Shoot
   - **ESC** - Pause/Return to menu

## Objective

Eliminate all 10 enemies to win the game. Each enemy takes 3 shots to destroy. Be careful - enemies will approach and damage you if they get too close!

## Game Mechanics

- You start with 100 health and 30 ammo
- Each kill gives you 100 points
- Enemies have 100 health each
- Enemies deal damage when they get close to you
- Game ends when all enemies are defeated (win) or your health reaches 0 (lose)

## Technical Details

- Built with Three.js for 3D rendering
- Vanilla JavaScript for game logic
- HTML5 and CSS3 for UI
- No build process required - just open in a browser!

## Browser Requirements

- Modern browser with WebGL support
- Pointer Lock API support (available in all modern browsers)