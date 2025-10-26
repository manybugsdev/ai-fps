# AI-FPS - Simple First Person Shooter Game

A simple browser-based FPS game built with vanilla JavaScript and Canvas 2D using raycasting (similar to classic Wolfenstein 3D).

## Features

- First-person perspective with keyboard controls
- WASD/Arrow Keys for movement and rotation
- Raycasting engine for 3D-like rendering
- Shooting mechanics with ammo system
- Enemy AI that tracks and approaches the player
- Health system
- Score tracking
- Win/lose conditions

## How to Play

1. Open `index.html` in a web browser
2. Click "Start Game"
3. Use the following controls:
   - **W/Up Arrow** - Move forward
   - **S/Down Arrow** - Move backward
   - **A/Left Arrow** - Rotate left
   - **D/Right Arrow** - Rotate right
   - **Click** - Shoot
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

- Built with vanilla JavaScript - no external dependencies
- Canvas 2D for rendering
- Raycasting engine for pseudo-3D graphics
- Simple AI pathfinding for enemies
- HTML5 and CSS3 for UI
- No build process required - just open in a browser!

## Browser Requirements

- Modern browser with Canvas support (available in all modern browsers)