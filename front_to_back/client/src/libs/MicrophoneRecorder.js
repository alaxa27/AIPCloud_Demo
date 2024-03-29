import toBuffer from 'blob-to-buffer';
import AudioContext from './AudioContext';



let analyser;
let audioCtx;
let mediaRecorder;
let chunks = [];
let startTime;
let stream;
let mediaOptions;
let blobObject;
let onStartCallback;
let onStopCallback;
let dataCallback;

const constraints = {
  audio: true,
  video: false
}; // constraints - only audio needed

navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);

export class MicrophoneRecorder {
  constructor(onStart, onStop, data, options) {
    onStartCallback = onStart;
    onStopCallback = onStop;
    dataCallback = data;
    mediaOptions = options;
  }

  startRecording = () => {

    startTime = Date.now();

    if (mediaRecorder) {

      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        return;
      }

      if (audioCtx && mediaRecorder && mediaRecorder.state === 'inactive') {
        mediaRecorder.start(10);
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        if (onStartCallback) {
          onStartCallback()
        };
      }
    } else {
      if (navigator.mediaDevices) {
        console.log('getUserMedia supported.');

        navigator.mediaDevices.getUserMedia(constraints).then((str) => {
          stream = str;

          if (MediaRecorder.isTypeSupported(mediaOptions.mimeType)) {
            mediaRecorder = new MediaRecorder(str, mediaOptions);
          } else {
            mediaRecorder = new MediaRecorder(str);
          }

          if (onStartCallback) {
            onStartCallback()
          };

          mediaRecorder.onstop = this.onStop;

          audioCtx = AudioContext.getAudioContext();
          analyser = AudioContext.getAnalyser();

          mediaRecorder.start(10);

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          var processor = audioCtx.createScriptProcessor(1024, 1, 1);
          source.connect(processor);
          processor.connect(audioCtx.destination);

          processor.onaudioprocess = (e) => {
            let b = e.inputBuffer
            dataCallback(b)
          }
        });
      } else {
        alert('Your browser does not support audio recording');
      }
    }

  }

  stopRecording() {


    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      audioCtx.suspend();
    }
  }

  onStop(evt) {
    const blob = new Blob(chunks, {'type': mediaOptions.mimeType});
    chunks = [];

    const blobObject = {
      blob: blob,
      startTime: startTime,
      stopTime: Date.now(),
      options: mediaOptions,
      blobURL: window.URL.createObjectURL(blob)
    }

    if (onStopCallback) {
      onStopCallback(blobObject)
    };

  }

}
