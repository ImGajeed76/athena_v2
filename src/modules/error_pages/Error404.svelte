<script lang="ts">
    import {onMount} from "svelte";


    let mazeGame;

    async function afterMount() {
        const Phaser = await import('phaser');

        class MazeGame {
            game: Phaser.Game;
            maze: number[][];
            mazeWidth: number;
            mazeHeight: number;
            cellSize: number;

            constructor(mazeWidth, mazeHeight, cellSize) {
                this.mazeWidth = mazeWidth;
                this.mazeHeight = mazeHeight;
                this.cellSize = cellSize;
                this.maze = this.generateMaze(mazeWidth, mazeHeight);

                this.game = new Phaser.Game({
                    type: Phaser.AUTO,
                    width: mazeWidth * cellSize,
                    height: mazeHeight * cellSize,
                    parent: 'game_window',
                    backgroundColor: '#fdfdfd',
                    scene: {
                        preload: this.preload.bind(this),
                        create: this.create.bind(this),
                        update: this.update.bind(this)
                    }
                });
            }

            generateMaze(width: number, height: number) {
                let maze = Array.from({length: height}, () => Array.from({length: width}, () => 0));
                let stack: number[][] = [];
                let x = 0;
                let y = 0;

                maze[y][x] = 1;
                stack.push([x, y]);

                while (stack.length > 0) {
                    let [cx, cy] = stack[stack.length - 1];
                    let directions = this.getValidDirections(cx, cy, maze, width, height);

                    if (directions.length > 0) {
                        let [dx, dy] = directions[Math.floor(Math.random() * directions.length)];
                        maze[cy + dy][cx + dx] = 1;
                        stack.push([cx + dx, cy + dy]);
                    } else {
                        stack.pop();
                    }
                }

                return maze;
            }

            getValidDirections(x: number, y: number, maze: number[][], width: number, height: number) {
                let directions = [];

                // Check each direction (N, S, E, W) for a valid move
                if (y > 1 && maze[y - 2][x] === 0) directions.push([0, -2]); // North
                if (y < height - 2 && maze[y + 2][x] === 0) directions.push([0, 2]); // South
                if (x > 1 && maze[y][x - 2] === 0) directions.push([-2, 0]); // West
                if (x < width - 2 && maze[y][x + 2] === 0) directions.push([2, 0]); // East

                return directions;
            }

            preload() {
                // Load assets if needed
            }

            create() {
            }

            update() {
                // Update game logic if needed
            }
        }

        mazeGame = new MazeGame(800 / 10, 800 / 10, 10);
    }


    onMount(() => {
        afterMount();
    });
</script>

<div class="absolute w-screen h-screen top-0 left-0 p-5 grid grid-cols-2 items-center">
    <div class="w-full">
        <div class="m-auto w-fit">
            <h1 class="text-6xl">404</h1>
            <h2 class="text-2xl">You reached a unknown territory!</h2>
            <hr class="my-5 h-[2px] bg-black">
            <p class="text-lg">The page you are looking for does not exist. <br>
                You can now either just press the buttons below to get back or <br>
                you could solve a fun little maze on the right to find your exit.</p>
            <div class="flex-row flex mt-5">
                <button class="btn variant-filled-secondary btn-3d-secondary mr-3">Home</button>
                <button class="btn variant-filled-primary btn-3d-primary">Back</button>
            </div>
        </div>
    </div>
    <div id="game_window"></div>
</div>