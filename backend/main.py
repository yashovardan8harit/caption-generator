from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import time
import hashlib

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# CORS configuration for frontend dev environment
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Update this if frontend URL changes
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic model for caption generation request
class CaptionRequest(BaseModel):
    image_url: str

@app.get("/")
def read_root():
    """Health check endpoint"""
    return {"message": "Caption Generator API is running!"}

@app.get("/generate-signature")
def generate_signature():
    """
    Generates a Cloudinary signature using timestamp and secret,
    which is used for secure (signed) uploads.
    """
    timestamp = int(time.time())
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")

    if not (api_secret and api_key and cloud_name):
        return JSONResponse(
            status_code=500,
            content={"error": "Missing Cloudinary credentials in environment variables."}
        )

    # Parameters that will be sent with the upload (must match frontend)
    params_to_sign = {
        'folder': 'uploads',
        'timestamp': timestamp
    }
    
    # Sort parameters alphabetically by key
    sorted_params = sorted(params_to_sign.items())
    
    # Create parameter string: key1=value1&key2=value2
    params_string = '&'.join([f"{k}={v}" for k, v in sorted_params])
    
    # Add API secret at the end
    string_to_sign = params_string + api_secret
    signature = hashlib.sha256(string_to_sign.encode()).hexdigest()

    # Debug logging (remove in production)
    print(f"String to sign: {string_to_sign}")
    print(f"Generated signature: {signature}")

    return JSONResponse({
        "timestamp": timestamp,
        "signature": signature,
        "api_key": api_key,
        "cloud_name": cloud_name,
        "folder": "uploads"  # Include folder in response so frontend knows to send it
    })

@app.post("/generate-caption")
def generate_caption(request: CaptionRequest):
    """
    Generate caption for uploaded image
    For now, this is a dummy implementation
    You can integrate with AI services like OpenAI Vision, Google Vision, etc.
    """
    try:
        image_url = request.image_url
        
        # Validate URL
        if not image_url or not image_url.startswith('http'):
            raise HTTPException(status_code=400, detail="Invalid image URL")
        
        # Dummy caption generation - replace with actual AI service
        # You can integrate with OpenAI Vision API, Google Vision API, etc.
        dummy_captions = [
            "A beautiful moment captured in time 📸✨",
            "Living life to the fullest! 🌟",
            "Picture perfect memories 💫",
            "Incredible view and amazing vibes! 🔥",
            "Sometimes the simplest moments are the most extraordinary 🌈"
        ]
        
        import random
        selected_caption = random.choice(dummy_captions)
        
        return JSONResponse({
            "success": True,
            "caption": selected_caption,
            "image_url": image_url
        })
        
    except Exception as e:
        print(f"Error generating caption: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate caption")

@app.get("/test-env")
def test_environment():
    """Test endpoint to check if environment variables are loaded"""
    return {
        "cloudinary_configured": bool(os.getenv("CLOUDINARY_API_KEY")),
        "cloud_name_exists": bool(os.getenv("CLOUDINARY_CLOUD_NAME")),
        "api_secret_exists": bool(os.getenv("CLOUDINARY_API_SECRET"))
    }