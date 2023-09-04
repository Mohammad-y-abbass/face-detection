const video = document.getElementById("video");
let displaySize; // Declare displaySize outside the event listener

// Load models and start video once models are loaded
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
  faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
  faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
  faceapi.nets.faceExpressionNet.loadFromUri("/models"),
  faceapi.nets.ageGenderNet.loadFromUri("/models"),
])
  .then(startVideo)
  .catch((error) => {
    console.error("Error loading models:", error);
  });

function startVideo() {
  // Access the webcam and set the video source
  navigator.mediaDevices
    .getUserMedia({
      video: true,
      audio: false,
    })
    .then((cameraStream) => {
      video.srcObject = cameraStream;
    });
}

video.addEventListener("play", () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);
  displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  // Function to update display size and redraw detections
  function updateDisplaySizeAndRedraw() {
    displaySize = { width: video.width, height: video.height };
    faceapi.matchDimensions(canvas, displaySize);
    redrawDetections();
  }

  // Attach a resize event listener to the window
  window.addEventListener("resize", updateDisplaySizeAndRedraw);

  setInterval(async () => {
    try {
      // Detect faces with age, gender, and expressions
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
      faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

      // Display age and gender for each detected face
      resizedDetections.forEach((detection) => {
        const box = detection.detection.box;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: Math.round(detection.age) + " year old " + detection.gender,
        });
        drawBox.draw(canvas);
      });
    } catch (error) {
      console.error("Error processing face detection:", error);
    }
  }, 100);
});
