import { Agent } from "./agent";

export class Bunny {
    constructor(id, app) {
        var initial_x = Math.floor(Math.random() * Math.floor(app.canvasWidth));
        var initial_y = Math.floor(Math.random() * Math.floor(app.canvasHeight));
        Agent.call(this, id, initial_x, initial_y, app.canvas, app.space, false);
        
        this.app = app;
        this.speed = app.movementSpeedBunny;
        this.sight = app.sightDistanceBunny;
    }

    get isAlive() {
        return false === this.app.bunniesKilled.includes(this.id);
    }

    draw(context, pos) {
        var grave_icon = new Image();
        grave_icon.src = 'grave-normal.png';

        if (this.app.avatarFileNameGrave) {
            grave_icon.src = this.app.avatarFileNameGrave[0].name;
        }

        var bunny_icon = new Image();
        bunny_icon.src = 'bunny-normal.png';

        if (this.app.avatarFileNameBunny) {
            bunny_icon.src = this.app.avatarFileNameBunny[0].name;
        }
        
        if (!this.app.bunniesKilled.includes(this.id)) {
            context.drawImage(bunny_icon, pos.x, pos.y);
        } else if(this.app.drawGraves) {
            context.drawImage(grave_icon, pos.x, pos.y);
        }
    }

    update(deltaTime) {
        if (this.app.bunniesKilled.includes(this.id)) {
            return false;
        }

        var boids = this.space.findAllAgents();
        var pos = this.space.getLocation(this.id);

        for (var boidId in boids)
        {
            var boid = boids[boidId];
            var boid_pos = this.space.getLocation(boid.id);
            var distance = pos.distance(boid_pos);
            if (!boid.isAlive) {
                continue;
            }
            if (boid != this && !boid.isPredator)
            {
                if (distance < this.separation_space)
                {
                    // Separation
                    this.velocity.x += pos.x - boid_pos.x;
                    this.velocity.y += pos.y - boid_pos.y;
                }
                else if (distance < this.sight)
                {
                    // Cohesion
                    this.velocity.x += (boid_pos.x - pos.x) * 0.05;
                    this.velocity.y += (boid_pos.y - pos.y) * 0.05;
                }
                if (distance < this.sight)
                {
                    // Alignment
                    this.velocity.x += boid.velocity.x * 0.5;
                    this.velocity.y += boid.velocity.y * 0.5;
                }
            }
            if (boid.isPredator && distance < this.sight)
            {
                // Avoid predators.
                this.velocity.x += pos.x - boid_pos.x;
                this.velocity.y += pos.y - boid_pos.y;
            }
        }

        Agent.prototype.move.call(this, deltaTime, pos);
        
        if (this.app.lifeExpectancyBunny > 0 && this.lifeExpectancy > this.app.lifeExpectancyBunny) {
            // Death de vieillesse
            this.app.killBunny(this.id);
        }
        this.lifeExpectancy++;
    }
}