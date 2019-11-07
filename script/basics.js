"use strict";

// web audio api specs: https://webaudio.github.io/web-audio-api/#dom-analysernode-getbytefrequencydata

// localhost:8000

{ // start scope

window.addEventListener("load", () => {
    let myTable = document.querySelector("#music-info");
    let myBtn = document.querySelector("#start");

    myBtn.addEventListener("click", (event) => {

        const audioCtx = new AudioContext();

        // create an html audio element
        const audioEle = new Audio();
        audioEle.src = 'data/TheSlopesOfTheBlessure.mp3'; //insert file name here
        audioEle.autoplay = true;
        audioEle.preload = 'auto';
        let musicSourceText = document.querySelector("#music-source");
        musicSourceText.textContent = audioEle.src;

        // create MediaElementAudioSourceNode
        const audioSourceNode = audioCtx.createMediaElementSource(audioEle);

        // create an analyser node
        const analyserNode = audioCtx.createAnalyser();
        // window size in samples (number of samples) that is used
        // when performing a Fast Fourier Transform (FFT) to get frequency domain data
        // for 48000 Hz sampling rate, a fftSize of 256 is a windows of 256 / 48000 = 5.333... ms
        analyserNode.fftSize = 1024;
        const bufferLength = analyserNode.frequencyBinCount; // half of analyserNode.fftSize
        const dataArray = new Float32Array(bufferLength);

        // set up audio node network
        audioSourceNode.connect(analyserNode);
        analyserNode.connect(audioCtx.destination);

        let refreshCounter = 0;
        let timeStart = null;
        let timeElapsed = 0.0;
        let timeInterval = 0.0;
        let timeOld = 0.0;
        let fpsText = document.querySelector("#fps");
        let systemSampleRateText = document.querySelector("#system-sample-rate");
        let refreshCounterText = document.querySelector("#refresh-counter");
        let timeElapsedText = document.querySelector("#time-elapsed");
        let maxValueText = document.querySelector("#max-value");
        let minValueText = document.querySelector("#min-value");

        systemSampleRateText.textContent = audioCtx.sampleRate;

        // create plot
        let margin = {top: 10, right: 10, bottom: 10, left: 10};
        let width  = 0.9 * window.innerWidth - margin.left - margin.right;
        let height = 0.5 * window.innerHeight - margin.top - margin.bottom;

        const myPath = d3.select("#plot-div")
          .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
          .append("path")
            .attr("transform",
                  "translate(" + margin.left + "," + margin.top + ")");

        let xScale = d3.scaleLinear()
                       .domain([0, 1])
                       .range([0, 1]);

        let yScale = d3.scaleLinear()
                       .domain([0, 1])
                       .range([0, 1]);

        let lineGenerator = d3.line()
            .x((d, i) => { // convert x data to image coordinate
                return xScale(i);
            })
            .y((d, i) => { // convert y data to image coordinate
                return yScale(d);
            });

        // timeStamp in millisecond
        function startAnalysis(timeStamp) {
            requestAnimationFrame(startAnalysis);

            ++refreshCounter;
            refreshCounterText.textContent = refreshCounter;


            if(!timeStart) {
                timeStart = timeStamp;
            }

            timeElapsed = timeStamp - timeStart;
            timeElapsedText.textContent = (timeElapsed / 1000.0).toFixed(0);

            // update fps
            timeInterval = timeStamp - timeOld;
            fpsText.textContent = (1.0 / timeInterval * 1000.0).toFixed(0);
            timeOld = timeStamp;

            // get frequency data
            // frequency range: 0 ~ [AudioContextOptions.sampleRate / 2] Hz
            // for any sample which is silent, the value is -Infinity
            // each item in the array represents the decibel value for a specific frequency

            analyserNode.getFloatFrequencyData(dataArray);

            // convert decibel into linear quantity
            // inverse transform of https://webaudio.github.io/web-audio-api/#conversion-to-db
            dataArray.forEach((element, index, theArray) => {
                if(element != -Infinity) {
                    theArray[index] = Math.pow(10.0, element / 20.0);
                } else {
                    theArray[index] = 0.0;
                }
            });

            maxValueText.textContent = Math.max(...dataArray);
            minValueText.textContent = Math.min(...dataArray);

            width  = 0.9 * window.innerWidth - margin.left - margin.right;
            height = 0.5 * window.innerHeight - margin.top - margin.bottom;
            xScale.domain([0, dataArray.length - 1])
                   .range([0, width]);

            yScale.domain([0, Math.max(...dataArray)])
                  .range([height, 0]);

            let pathData = lineGenerator(dataArray);

            myPath.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                  .attr('d', pathData)
                  .attr("stroke", "blue")
                  .attr("stroke-width", 2)
                  .attr("fill", "none");
        };

        startAnalysis();

    });
});








} // stop scope









