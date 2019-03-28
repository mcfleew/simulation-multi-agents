export class Agent {
    constructor(id, app, isPredator) {
        var rank = 1;
        jssim.SimEvent.call(this, rank);
        this.id = id;
        this.app = app;
        this.space = app.space;
        var initial_x = Math.floor(Math.random() * Math.floor(app.canvasWidth));
        var initial_y = Math.floor(Math.random() * Math.floor(app.canvasHeight));
        this.space.updateAgent(this, initial_x, initial_y);
        this.speed = app.movementSpeedBunny;
        this.sight = app.sightDistanceBunny;
        this.separation_space = 30;
        this.velocity = new jssim.Vector2D(Math.random(), Math.random());
        this.isPredator = isPredator;
        this.border = app.canvasBorder;
        this.boundaryH = app.canvasHeight;
        this.boundaryW = app.canvasWidth;
        this.lastMealTime = 0;
        //this.size = new jssim.Vector2D(8, 8);
        //this.color = '#00aa00';
        if(isPredator){
            this.speed = app.movementSpeedFox;
            this.sight = app.sightDistanceFox;
            //this.color = '#ff0000';
            //this.size = new jssim.Vector2D(10, 10);
        }
    }

    initAgent() {
        this.__proto__ = Object.create(jssim.SimEvent);

        this.__proto__.removeAgent = function(agentId, isPredator) {
            function checkAgentId(agent) {
                return agentId === agent.id;
            }

            if (isPredator) {
                this.app.foxes.splice(this.app.bunnies.findIndex(checkAgentId), 1);
            } else {
                this.app.bunnies.splice(this.app.bunnies.findIndex(checkAgentId), 1);
            }
        };

        this.__proto__.update = function(deltaTime) {
            var boids = this.space.findAllAgents();
            var pos = this.space.getLocation(this.id);
            if(this.isPredator) {
                if (this.app.foxesDead.includes(this.id)) {
                    return false;
                }

                var prey = null;
                //var min_distance = 10000000; //this.sight
                for (var boidId in boids)
                {
                    if (this.app.bunniesKilled.includes(boidId) || this.app.foxesDead.includes(boidId)) {
                        continue;
                    }
                    var boid = boids[boidId];
                    if(!boid.isPredator) {
                        var boid_pos = this.space.getLocation(boid.id);
                        var distance = pos.distance(boid_pos);
                        if(this.separation_space > distance) {
                            // Kill bunny
                            this.lastMealTime = 0;
                            this.app.bunniesKilled.push(boidId);
                            this.removeAgent(boidId, false);
                        } else if(this.sight > distance) {
                            //this.sight = distance;
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
                this.lastMealTime++;
                if (this.lastMealTime > this.app.survivalTimeFox) {
                    // Starving to death
                    this.app.foxesDead.push(this.id);
                    this.removeAgent(this.id, true);
                }
                
            } else {
                if (this.app.bunniesKilled.includes(this.id)) {
                    return false;
                }

                for (var boidId in boids)
                {
                    if (this.app.bunniesKilled.includes(this.id) || this.app.foxesDead.includes(this.id)) {
                        continue;
                    }
                    var boid = boids[boidId];
                    var boid_pos = this.space.getLocation(boid.id);
                    var distance = pos.distance(boid_pos);
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
            }
            // check speed
            var speed = this.velocity.length();
            if(speed > this.speed) {
                this.velocity.resize(this.speed);
            }
            
            pos.x += this.velocity.x;
            pos.y += this.velocity.y;
              
            // check boundary
            var valW = this.boundaryW - this.border;
            var valH = this.boundaryH - this.border;
            if (pos.x < this.border) pos.x = valW;
            if (pos.y < this.border) pos.y = valH;
            if (pos.x > valW) pos.x = this.border;
            if (pos.y > valH) pos.y = this.border;
            //console.log("boid [ " + this.id + "] is at (" + pos.x + ", " + pos.y + ") at time " + this.time);
        };

        var fox_icon = new Image();
        fox_icon.src = 'fox.png';

        if (this.app.avatarFileNameFox) {
            fox_icon.src = this.app.avatarFileNameFox[0].name;
        }

        var bunny_icon = new Image();
        bunny_icon.src = 'bunny.png';

        if (this.app.avatarFileNameBunny) {
            bunny_icon.src = this.app.avatarFileNameBunny[0].name;
        }
                
        this.__proto__.draw = function(context, pos) {
            if (!this.app.bunniesKilled.includes(this.id) && !this.app.foxesDead.includes(this.id)) {
                if (this.isPredator) {
                    context.drawImage(fox_icon, pos.x, pos.y);
                } else {
                    context.drawImage(bunny_icon, pos.x, pos.y);
                }
            }
        };
    }
}
  
