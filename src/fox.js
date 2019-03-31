import { Agent } from "./agent";

export class Fox {
    constructor(id, app) {
        var initial_x = Math.floor(Math.random() * Math.floor(app.canvasWidth));
        var initial_y = Math.floor(Math.random() * Math.floor(app.canvasHeight));
        Agent.call(this, id, initial_x, initial_y, app.canvas, app.space, true);
        
        this.app = app;
        this.speed = app.movementSpeedFox;
        this.sight = app.sightDistanceFox;
    }

    get isAlive() {
        return false === this.app.foxesDead.includes(this.id);
    }

    draw(context, pos) {
        var grave_icon = new Image();
        grave_icon.src = 'grave-normal.png';

        if (this.app.avatarFileNameGrave) {
            grave_icon.src = this.app.avatarFileNameGrave[0].name;
        }

        var fox_icon = new Image();
        fox_icon.src = 'fox-normal.png';

        if (this.app.avatarFileNameFox) {
            fox_icon.src = this.app.avatarFileNameFox[0].name;
        }

        if (!this.app.foxesDead.includes(this.id)) {
            context.drawImage(fox_icon, pos.x, pos.y);
        } else if(this.app.drawGraves) {
            context.drawImage(grave_icon, pos.x, pos.y);
        }
    }

    update(deltaTime) {
        if (this.app.foxesDead.includes(this.id)) {
            return false;
        }

        var boids = this.space.findAllAgents();
        var pos = this.space.getLocation(this.id);

        var prey = null;
        //var min_distance = 10000000;
        for (var boidId in boids)
        {
            var boid = boids[boidId];
            if (!boid.isAlive) {
                continue;
            }
            if(!boid.isPredator) {
                var boid_pos = this.space.getLocation(boid.id);
                var distance = pos.distance(boid_pos);
                if(this.separation_space > distance){ 
                    // Kill bunny
                    this.lastMealTime = 0;
                    this.app.killBunny(boidId);
                } else if(this.sight > distance){ //min_distance
                    //min_distance = distance;
                    prey = boid;
                }
            } else {
                var boid_pos = this.space.getLocation(boid.id);
                var distance = pos.distance(boid_pos);
                if (distance < this.separation_space)
                {
                    // Separation
                    this.velocity.x += pos.x - boid_pos.x;
                    this.velocity.y += pos.y - boid_pos.y;
                }
            }
        }
        if(prey != null) {
            var prey_position = this.space.getLocation(prey.id);
            this.velocity.x += prey_position.x - pos.x;
            this.velocity.y += prey_position.y - pos.y;
        }

        Agent.prototype.move.call(this, deltaTime, pos);

        if (this.lastMealTime > this.app.survivalTimeFox) {
            // Starving to death
            this.app.killFox(this.id);
        }
        this.lastMealTime++;
        
        if (this.app.lifeExpectancyFox > 0 && this.lifeExpectancy > this.app.lifeExpectancyFox) {
            // Death de vieillesse
            this.app.killFox(this.id);
        }
        this.lifeExpectancy++;
    }
}