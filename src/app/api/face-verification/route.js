import { NextResponse } from 'next/server';
import * as faceapi from 'face-api.js';
import { Canvas, Image, ImageData, createCanvas } from 'canvas';
import path from 'path';

// Configure face-api to use node-canvas
faceapi.env.monkeyPatch({
  Canvas: Canvas,
  Image: Image,
  ImageData: ImageData,
  createCanvas: createCanvas
});

// Load face-api models
const loadModels = async () => {
  try {
    const modelPath = path.join(process.cwd(), 'public/models');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPath),
      faceapi.nets.faceLandmark68Net.loadFromDisk(modelPath),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPath)
    ]);
    return true;
  } catch (error) {
    console.error('Error loading models:', error);
    return false;
  }
};

// Initialize models
let modelsLoaded = false;

export async function POST(req) {
  try {
    // Load models if not already loaded
    if (!modelsLoaded) {
      modelsLoaded = await loadModels();
      if (!modelsLoaded) {
        return NextResponse.json(
          { error: 'Failed to initialize face detection models' },
          { status: 500 }
        );
      }
    }

 

    // Get image data from request
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

  

    // Convert blob to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create canvas and load image directly
    const image = new Image();
    image.src = buffer;


    // Create a canvas with the image dimensions
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);

    // Detect face
    const detection = await faceapi
      .detectSingleFace(canvas)
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      return NextResponse.json(
        { error: 'No face detected in image!' },
        { status: 400 }
      );
    }


    
   

    // Check confidence and return result
    const confidence = detection.detection.score;
    const isHuman = confidence > 0.9;


    /*return NextResponse.json(
      { error: 'debugging' },
      { status: 200 }
    );*/

    // Calculate additional face metrics
    const faceMetrics = {
      success: true,
      isHuman,
      confidence: confidence.toFixed(2),
      facePosition: {
        x: detection.detection.box.x,
        y: detection.detection.box.y,
        width: detection.detection.box.width,
        height: detection.detection.box.height
      }
    };

    console.log("dddddddddddddddddd")
    console.log(detection) 
    console.log("dddddddddddddddddd")

    console.log("isHuman isHuman")
    console.log(isHuman) 
    console.log("isHuman isHuman")
    
    return NextResponse.json(faceMetrics);

  } catch (error) {

    console.error('Face verification error:', error);
    return NextResponse.json(
      { 
        error: 'Face verification failed',
        details: error.message,
        type: error.name
      },
      { status: 500 }
    );
  }

}