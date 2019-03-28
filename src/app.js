import {Agent} from './agent';

export class App {
    constructor() {
        this.refreshCanvas = null;
        this.refreshChart = 0;
        this.chart = null;
        this.scheduler = new jssim.Scheduler();
        this.space = new jssim.Space2D();

        this.avatarFileNameBunny = "";
        this.avatarFileNameFox = "";

        this.simulationTime = 0;
        this.canvasBorder = 10;
        this.canvasHeight = 400;
        this.canvasWidth = 800;

        this.showCanvas = false;
        this.showForm = false;
        this.showTitle = true;
        this.showOptions = false;
        this.showChart = false;

        this.bunnies = [];
        this.bunniesKilled = [];
        this.foxes = [];
        this.foxesDead = [];

        this.lastMeasuresLabels = [];
        this.lastMeasuresBunnies = [];
        this.lastMeasuresFoxes = [];

        this.initialNumberOfBunnies = 0;
        this.initialNumberOfFoxes = 0;
        this.respawnFrequencyBunny = 0;
        //this.respawnFrequencyFox = 0;
        this.sightDistanceBunny = 0;
        this.sightDistanceFox = 0;
        //this.survivalTimeBunny = 0;
        this.lifeExpectancyBunny = 0;
        this.lifeExpectancyFox = 0;
        this.survivalTimeFox = 0;
        this.movementSpeedBunny = 0;
        this.movementSpeedFox = 0;

        this.chartUpdateFrequency = 0;
        this.chartUpdateMeasurement = 0;
        this.chartLastMeasuresNumber = 0;

        this.updateFrequencies = [
            { frequency: 1 },
            { frequency: 10 },
            { frequency: 20 },
            { frequency: 30 }
        ];
        this.updateMeasurement = [
            { measurement:1, title: 'Secondes' },
            { measurement:60, title: 'Minutes' },
            { measurement:3600, title: 'Heures' }
        ];
        this.numberOfMeasures = [
            { count: 10 },
            { count: 25 },
            { count: 50 },
            { count: 100 }
        ];
        this.respawnLevels = [
            { frequency: 1000, title: 'Très très lente' },
            { frequency: 500, title: 'Très lente' },
            { frequency: 250, title: 'Lente' },
            { frequency: 100, title: 'Normale' },
            { frequency: 50, title: 'Rapide' },
            { frequency: 25, title: 'Très rapide' },
            { frequency: 10, title: 'Très très rapide' },
            { frequency: 0, title: 'Pas d\'apparition' }
        ];
    }

    get respawnFrequencyFox() {
        return (this.respawnFrequencyBunny * 10);
    }

    get chartUpdateInterval() {
        return (100 * this.chartUpdateMeasurement * this.chartUpdateFrequency);
    }

    initForm() {
        this.resetForm();

        this.showTitle = false;
        this.showForm = true;
    }

    initCanvas(resetCanvas) {
        if (resetCanvas) {
            this.resetCanvas();
            this.resetChart();
        }

        this.chart = this.drawChart();

        this.showCanvas = true;
        this.showForm = false;

        this.playCanvas(100);
    }

    initAgents() {
        for(var i = 0; i < this.initialNumberOfBunnies; ++i) {
            this.addBunny('B0_'+i);
        }

        for(var j = 0; j < this.initialNumberOfFoxes; ++j) {
            this.addFox('F0_'+j);
        }
    }

    addBunny(Id) {
        var bunny = new Agent(Id, this, false);
        bunny.initAgent();
        this.bunnies.push(bunny);
        this.scheduler.scheduleRepeatingIn(bunny, 1);
    }

    addFox(Id) {
        var fox = new Agent(Id, this, true);
        fox.initAgent();
        this.foxes.push(fox);
        this.scheduler.scheduleRepeatingIn(fox, 1);
    }

    playCanvas(step) {
        clearInterval(this.refreshCanvas);
        this.refreshChart = 0;

        var canvas = document.getElementById("myCanvas");
    
        var self = this;

        if (step > 0) {
            self.refreshCanvas = setInterval(function(){
                if (self.scheduler.current_time > 0) {
                    if (self.scheduler.current_time % self.respawnFrequencyBunny === 0) {
                        self.addBunny('B0'+self.scheduler.current_time);
                    }
                    if (self.scheduler.current_time % self.respawnFrequencyFox === 0) {
                        self.addFox('F0'+self.scheduler.current_time);
                    }
                    
                    if (self.refreshChart % self.chartUpdateInterval === 0) {
                        var tooManyItems = (self.chart.data.labels.length >= self.chartLastMeasuresNumber && self.chartLastMeasuresNumber > 0);
                    
                        if (tooManyItems) {
                            self.chart.data.labels.shift();
                        }

                        self.chart.data.labels.push(self.scheduler.current_time);
                        self.chart.data.datasets.forEach((dataset) => {
                            if (tooManyItems) {
                                dataset.data.shift();
                            }
                            
                            if (dataset.label.endsWith('lapins')) {
                                dataset.data.push(self.bunnies.length);
                            }
                            if (dataset.label.endsWith('renards')) {
                                dataset.data.push(self.foxes.length);
                            }
                        });
                        self.chart.update();
                    }
                    self.refreshChart += step / 10;
                }
    
                self.scheduler.update();
                
                self.space.render(canvas);
                //console.log('current simulation time: ' + self.scheduler.current_time);
                self.simulationTime = self.scheduler.current_time;
            }, step);
        }
    }

    stopCanvas() {
        clearInterval(this.refreshCanvas);
        this.refreshChart = 0;

        this.showCanvas = false;
        this.showForm = true;
    }

    drawChart() {
        var ctx = document.getElementById('myChart').getContext('2d');
        var chart = new Chart(ctx, {
            // The type of chart we want to create
            type: 'line',

            // The data for our dataset
            data: {
                labels: this.lastMeasuresLabels,
                datasets: [{
                    label: 'Nombre de lapins',
                    //backgroundColor: 'rgb(255, 199, 132)',
                    borderColor: 'rgb(255, 199, 132)',
                    data: this.lastMeasuresBunnies
                },{
                    label: 'Nombre de renards',
                    //backgroundColor: 'rgb(255, 99, 132)',
                    borderColor: 'rgb(255, 99, 132)',
                    data: this.lastMeasuresFoxes
                }]
            },

            // Configuration options go here
            options: {}
        });

        return chart;
    }

    resetForm() {
        this.initialNumberOfBunnies = 15;
        this.initialNumberOfFoxes = 3;
        this.respawnFrequencyBunny = 100;
        //this.respawnFrequencyFox = 1000;
        this.sightDistanceBunny = 75;
        this.sightDistanceFox = 75;
        //this.survivalTimeBunny = 10000;
        this.survivalTimeFox = 200;
        this.lifeExpectancyBunny = 500;
        this.lifeExpectancyFox = 1000;
        this.movementSpeedBunny = 12;
        this.movementSpeedFox = 24;

        this.avatarFileNameBunny = "";
        this.avatarFileNameFox = "";
        this.canvasHeight = 400;
        this.canvasWidth = 800;
        this.showChart = false;

        this.chartUpdateFrequency = 1;
        this.chartUpdateMeasurement = 1;
        this.chartLastMeasuresNumber = 25;
    }

    resetCanvas() {
        this.bunnies = [];
        this.bunniesKilled = [];
        this.foxes = [];
        this.foxesDead = [];

        this.scheduler.reset();
        this.space.reset();
        this.initAgents();
    }

    resetChart() {
        this.lastMeasuresLabels = [];
        this.lastMeasuresBunnies = [];
        this.lastMeasuresFoxes = [];
    }

    showMoreOptions(showOptions) {
        if (showOptions) {
            this.showOptions = true;
        } else {
            this.showOptions = false;
        }
    }
}
  
